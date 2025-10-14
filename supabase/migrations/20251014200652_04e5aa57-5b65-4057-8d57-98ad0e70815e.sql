-- Hader HR Attendance System Database Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'hr_admin', 'loc_manager', 'employee');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'personal', 'emergency', 'unpaid');
CREATE TYPE attendance_method AS ENUM ('qr', 'color', 'code', 'manual');
CREATE TYPE record_status AS ENUM ('pending', 'approved', 'rejected', 'suspicious');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{
    "attendance_methods": {
      "qr_code": {"enabled": true, "refresh_interval": 120, "priority": 1},
      "color": {"enabled": true, "refresh_interval": 20, "colors": ["red","green","blue","yellow"], "priority": 2},
      "code": {"enabled": true, "refresh_interval": 300, "digits": 4, "priority": 3}
    },
    "verification": {
      "gps": {"enabled": true, "required": true, "radius": 100},
      "selfie": {"mode": "on_suspicion", "face_recognition": true}
    },
    "suspicion": {
      "enabled": true,
      "gps_out_range": 40,
      "unusual_time": 15,
      "threshold": 50,
      "verification_timeout": 20
    }
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branches table
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  gps_radius INTEGER DEFAULT 100,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'employee',
  notification_preferences JSONB DEFAULT '{"whatsapp": true, "email": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts table
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_duration INTEGER DEFAULT 0,
  work_days JSONB DEFAULT '["sun","mon","tue","wed","thu"]'::jsonb,
  late_arrival_buffer INTEGER DEFAULT 15,
  work_hours DECIMAL(4, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  department TEXT,
  position TEXT,
  hire_date DATE NOT NULL,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  vacation_balance INTEGER DEFAULT 21,
  sick_leave_balance INTEGER DEFAULT 15,
  face_encoding TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance records table (MOST IMPORTANT)
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ,
  expected_check_in TIMESTAMPTZ,
  expected_check_out TIMESTAMPTZ,
  method_used attendance_method NOT NULL,
  method_data JSONB DEFAULT '{}'::jsonb,
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  gps_distance DECIMAL(8, 2),
  gps_accuracy DECIMAL(8, 2),
  selfie_url TEXT,
  selfie_data JSONB DEFAULT '{}'::jsonb,
  suspicious_score INTEGER DEFAULT 0,
  suspicious_reasons JSONB DEFAULT '[]'::jsonb,
  status record_status DEFAULT 'approved',
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  late_minutes INTEGER DEFAULT 0,
  work_hours DECIMAL(4, 2),
  overtime_hours DECIMAL(4, 2),
  device_info JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification requests table
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  suspicious_score INTEGER NOT NULL,
  suspicious_reasons JSONB NOT NULL,
  status request_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR codes table (dynamic)
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  code_data TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Color codes table (dynamic)
CREATE TABLE color_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  current_color TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Numeric codes table (dynamic)
CREATE TABLE numeric_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave requests table
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status request_status DEFAULT 'pending',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom requests table
CREATE TABLE custom_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  status request_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location managers junction table
CREATE TABLE location_managers (
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (location_id, user_id)
);

-- Verification codes table (for password reset)
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  method TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_employees_location ON employees(location_id);
CREATE INDEX idx_employees_number ON employees(employee_number);
CREATE INDEX idx_attendance_employee ON attendance_records(employee_id);
CREATE INDEX idx_attendance_location ON attendance_records(location_id);
CREATE INDEX idx_attendance_checkin ON attendance_records(check_in);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_verification_status ON verification_requests(status);
CREATE INDEX idx_verification_expires ON verification_requests(expires_at);
CREATE INDEX idx_qr_codes_expires ON qr_codes(expires_at);
CREATE INDEX idx_qr_codes_location ON qr_codes(location_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON verification_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_requests_updated_at BEFORE UPDATE ON custom_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, full_name, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    (NEW.raw_user_meta_data->>'company_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE numeric_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "HR admins can view company users" ON users
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
    )
  );

CREATE POLICY "Location managers can view location employees" ON users
  FOR SELECT USING (
    id IN (
      SELECT e.user_id FROM employees e
      WHERE e.location_id IN (
        SELECT location_id FROM location_managers WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for attendance_records
CREATE POLICY "Employees view own attendance" ON attendance_records
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Employees insert own attendance" ON attendance_records
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Location managers view location attendance" ON attendance_records
  FOR ALL USING (
    location_id IN (
      SELECT location_id FROM location_managers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "HR admins view company attendance" ON attendance_records
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
    )
  );

-- RLS Policies for verification_requests
CREATE POLICY "Employees view own verifications" ON verification_requests
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Location managers manage verifications" ON verification_requests
  FOR ALL USING (
    attendance_record_id IN (
      SELECT id FROM attendance_records
      WHERE location_id IN (
        SELECT location_id FROM location_managers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "HR admins manage all verifications" ON verification_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
    )
  );

-- RLS Policies for QR/Color/Numeric codes
CREATE POLICY "Location managers manage codes" ON qr_codes
  FOR ALL USING (
    location_id IN (
      SELECT location_id FROM location_managers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees view active codes" ON qr_codes
  FOR SELECT USING (
    expires_at > NOW() AND
    location_id IN (
      SELECT location_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Location managers manage color codes" ON color_codes
  FOR ALL USING (
    location_id IN (
      SELECT location_id FROM location_managers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees view active color codes" ON color_codes
  FOR SELECT USING (
    expires_at > NOW() AND
    location_id IN (
      SELECT location_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Location managers manage numeric codes" ON numeric_codes
  FOR ALL USING (
    location_id IN (
      SELECT location_id FROM location_managers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees view active numeric codes" ON numeric_codes
  FOR SELECT USING (
    expires_at > NOW() AND
    location_id IN (
      SELECT location_id FROM employees WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for leave_requests
CREATE POLICY "Employees manage own leave requests" ON leave_requests
  FOR ALL USING (employee_id = auth.uid());

CREATE POLICY "Managers view location leave requests" ON leave_requests
  FOR SELECT USING (
    employee_id IN (
      SELECT e.user_id FROM employees e
      WHERE e.location_id IN (
        SELECT location_id FROM location_managers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "HR admins manage company leave requests" ON leave_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
    )
  );

-- RLS Policies for custom_requests (similar to leave_requests)
CREATE POLICY "Employees manage own custom requests" ON custom_requests
  FOR ALL USING (employee_id = auth.uid());

CREATE POLICY "Managers view location custom requests" ON custom_requests
  FOR SELECT USING (
    employee_id IN (
      SELECT e.user_id FROM employees e
      WHERE e.location_id IN (
        SELECT location_id FROM location_managers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "HR admins manage company custom requests" ON custom_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hr_admin', 'super_admin')
    )
  );

-- Insert demo data
INSERT INTO companies (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'شركة الحضور الذكي');

INSERT INTO branches (id, company_id, name, address) VALUES 
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'الفرع الرئيسي', 'الرياض - حي الملك فهد');

INSERT INTO locations (id, company_id, branch_id, name, address, lat, lng, gps_radius) VALUES 
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'مستودع الشرق', 'الرياض - طريق الدمام', 24.7136, 46.6753, 100);

INSERT INTO shifts (id, location_id, name, start_time, end_time, work_hours) VALUES 
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000021', 'الصباحية', '08:00:00', '17:00:00', 8.0);