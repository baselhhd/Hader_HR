# Hader HR - Complete Development Prompt

## 🎯 Project Overview

Build a modern, beautiful, and responsive HR attendance management system called **"Hader HR"**. This is a SaaS platform that revolutionizes attendance tracking 
by eliminating the need for expensive biometric devices. Instead, it uses innovative web-based methods (QR codes, color matching, numeric codes) that work on any device
**Target Market**: Small to medium businesses in Saudi Arabia and Arabic-speaking markets.

**Key Innovation**: 
- No hardware required - works 100% through web browsers
- Mobile-first design (80% of users will access via smartphones)
- Smart suspicion detection with AI-like scoring
- WhatsApp integration for notifications and password recovery
- Beautiful, simple, and intuitive Arabic/RTL interface

--



Hader HR - Complete Development Guide (Part 1)
## 🛠️ Tech Stack (Use These Exactly)

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (install ALL components we'll use)
- **State Management**: React Context API + Hooks
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date/Time**: date-fns
- **QR Code**: 
  - Generation: `qrcode.react`
  - Scanning: `html5-qrcode` (works better in browsers)
- **Notifications**: react-hot-toast
- **HTTP**: Fetch API with error handling

### Backend & Database
- **Backend**: Supabase (all-in-one solution)
  - PostgreSQL Database
  - Authentication (Supabase Auth)
  - Storage (for selfie images)
  - Row Level Security (RLS) for permissions
  - Realtime subscriptions
- **File Storage**: Supabase Storage (for avatars and selfies)

### Design System

#### Colors (Tailwind Config)
```javascript
colors: {
  primary: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',  // Main primary
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  success: {
    500: '#10B981',
    600: '#059669',
  },
  error: {
    500: '#EF4444',
    600: '#DC2626',
  },
  warning: {
    500: '#F59E0B',
    600: '#D97706',
  }
}
```

#### Typography
- **Arabic Font**: 'IBM Plex Sans Arabic' (load from Google Fonts)
- **English/Numbers Font**: 'Inter' (load from Google Fonts)
- **Font Sizes**: Use Tailwind's default scale
- **RTL Support**: Configure Tailwind for RTL

#### Spacing & Layout
- **Container Max Width**: 1440px
- **Responsive Breakpoints**: Use Tailwind defaults
- **Border Radius**: Prefer rounded-xl (12px) for cards, rounded-lg (8px) for buttons

---

## 📊 Database Schema (Supabase PostgreSQL)

Create these tables in order with proper foreign keys and indexes:

### 1. companies
```sql
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
      "selfie": {"mode": "on_suspicion", "face_recognition": true, "liveness_detection": true}
    },
    "suspicion": {
      "enabled": true,
      "gps_out_range": 40,
      "unusual_time": 15,
      "different_pattern": 10,
      "previous_suspicious": 20,
      "threshold": 50,
      "verification_timeout": 20
    }
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_companies_active ON companies(is_active);
```

### 2. branches
```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_branches_company ON branches(company_id);
CREATE INDEX idx_branches_active ON branches(is_active);
```

### 3. locations
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
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

-- Indexes
CREATE INDEX idx_locations_company ON locations(company_id);
CREATE INDEX idx_locations_branch ON locations(branch_id);
CREATE INDEX idx_locations_active ON locations(is_active);
CREATE INDEX idx_locations_gps ON locations(lat, lng);
```

### 4. users (extends Supabase auth.users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  phone_verified BOOLEAN DEFAULT false,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'hr_admin', 'loc_manager', 'employee')),
  notification_preferences JSONB DEFAULT '{
    "whatsapp": true,
    "email": true,
    "push": true
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

### 5. employees (extends users for employees)
```sql
CREATE TABLE employees (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  department TEXT,
  position TEXT,
  hire_date DATE,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  custom_schedule JSONB,
  vacation_balance INTEGER DEFAULT 21,
  sick_leave_balance INTEGER DEFAULT 10,
  face_encoding TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_employees_location ON employees(location_id);
CREATE INDEX idx_employees_shift ON employees(shift_id);
CREATE INDEX idx_employees_number ON employees(employee_number);
CREATE INDEX idx_employees_active ON employees(is_active);
```

### 6. location_managers (junction table)
```sql
CREATE TABLE location_managers (
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (location_id, user_id)
);

-- Indexes
CREATE INDEX idx_location_managers_location ON location_managers(location_id);
CREATE INDEX idx_location_managers_user ON location_managers(user_id);
```

### 7. shifts
```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_duration INTEGER DEFAULT 0,
  work_days JSONB DEFAULT '["sun","mon","tue","wed","thu"]'::jsonb,
  late_arrival_buffer INTEGER DEFAULT 15,
  early_arrival_buffer INTEGER DEFAULT 15,
  early_leave_buffer INTEGER DEFAULT 15,
  late_leave_buffer INTEGER DEFAULT 15,
  work_hours DECIMAL(4,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shifts_location ON shifts(location_id);
CREATE INDEX idx_shifts_active ON shifts(is_active);
```

### 8. attendance_records
```sql
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ,
  expected_check_in TIME,
  expected_check_out TIME,
  method_used TEXT NOT NULL CHECK (method_used IN ('qr', 'color', 'code', 'manual')),
  method_data JSONB,
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  gps_distance INTEGER,
  gps_accuracy DECIMAL(6,2),
  selfie_url TEXT,
  selfie_data JSONB,
  suspicious_score INTEGER DEFAULT 0,
  suspicious_reasons JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'suspicious')),
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  late_minutes INTEGER DEFAULT 0,
  early_leave_minutes INTEGER DEFAULT 0,
  work_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  device_info JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, DATE(check_in));
CREATE INDEX idx_attendance_location_date ON attendance_records(location_id, DATE(check_in));
CREATE INDEX idx_attendance_company_date ON attendance_records(company_id, DATE(check_in));
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_method ON attendance_records(method_used);
CREATE INDEX idx_attendance_check_in ON attendance_records(check_in);
```

### 9. verification_requests
```sql
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  suspicious_score INTEGER NOT NULL,
  suspicious_reasons JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_verification_status ON verification_requests(status);
CREATE INDEX idx_verification_expires ON verification_requests(expires_at);
CREATE INDEX idx_verification_employee ON verification_requests(employee_id);
CREATE INDEX idx_verification_manager ON verification_requests(manager_id);
```

### 10. qr_codes (dynamic QR codes)
```sql
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  code_data TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_qr_location_expires ON qr_codes(location_id, expires_at);
CREATE INDEX idx_qr_code_data ON qr_codes(code_data);
```

### 11. color_codes (dynamic color codes)
```sql
CREATE TABLE color_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  current_color TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_color_location_expires ON color_codes(location_id, expires_at);
```

### 12. numeric_codes (dynamic numeric codes)
```sql
CREATE TABLE numeric_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_numeric_location_expires ON numeric_codes(location_id, expires_at);
```

### 13. leave_requests
```sql
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'emergency', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_created ON leave_requests(created_at);
```

### 14. custom_requests
```sql
CREATE TABLE custom_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_custom_requests_employee ON custom_requests(employee_id);
CREATE INDEX idx_custom_requests_status ON custom_requests(status);
CREATE INDEX idx_custom_requests_created ON custom_requests(created_at);
```

### 15. verification_codes (for password reset)
```sql
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('password_reset', 'phone_verify', 'email_verify')),
  method TEXT NOT NULL CHECK (method IN ('whatsapp', 'email', 'sms')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_verification_codes_user ON verification_codes(user_id, type);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
```

### 16. whatsapp_messages (logging)
```sql
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  message_id TEXT,
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_whatsapp_messages_user ON whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_type ON whatsapp_messages(type);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at);
```

### Functions & Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_updated_at BEFORE UPDATE ON verification_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_updated_at BEFORE UPDATE ON custom_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate attendance metrics automatically
CREATE OR REPLACE FUNCTION calculate_attendance_metrics()
RETURNS TRIGGER AS $$
DECLARE
  shift_start TIME;
  shift_end TIME;
BEGIN
  -- Get shift times
  IF NEW.shift_id IS NOT NULL THEN
    SELECT start_time, end_time INTO shift_start, shift_end
    FROM shifts WHERE id = NEW.shift_id;
    
    -- Calculate late minutes
    IF shift_start IS NOT NULL THEN
      NEW.late_minutes := GREATEST(0, 
        EXTRACT(EPOCH FROM (NEW.check_in::TIME - shift_start)) / 60
      );
    END IF;
    
    -- Calculate work hours if checked out
    IF NEW.check_out IS NOT NULL THEN
      NEW.work_hours := EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600;
      
      -- Calculate early leave minutes
      IF shift_end IS NOT NULL THEN
        NEW.early_leave_minutes := GREATEST(0,
          EXTRACT(EPOCH FROM (shift_end - NEW.check_out::TIME)) / 60
        );
      END IF;
      
      -- Calculate overtime (if worked more than shift hours)
      IF NEW.work_hours > (SELECT work_hours FROM shifts WHERE id = NEW.shift_id) THEN
        NEW.overtime_hours := NEW.work_hours - (SELECT work_hours FROM shifts WHERE id = NEW.shift_id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_attendance_before_save
  BEFORE INSERT OR UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION calculate_attendance_metrics();
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

-- Super Admin: See everything
CREATE POLICY "Super admins see all" ON companies FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- HR Admin: See their company
CREATE POLICY "HR sees company data" ON companies FOR SELECT
  USING (id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('hr_admin', 'loc_manager', 'employee')));

-- Employees: See only their own data
CREATE POLICY "Employees see own records" ON attendance_records FOR SELECT
  USING (employee_id = auth.uid());

-- Location Managers: See their location(s) data
CREATE POLICY "Location managers see location records" ON attendance_records FOR SELECT
  USING (
    location_id IN (
      SELECT location_id FROM location_managers WHERE user_id = auth.uid()
    )
  );

-- Similar policies for other tables...
-- (Add more RLS policies as needed for INSERT, UPDATE, DELETE)
```

---

## 🎨 UI Components & Pages to Build

### Shared Components (Create First)

#### 1. Layout Components
```tsx
// DashboardLayout.tsx
- Sidebar (collapsible on mobile)
- TopBar (with user menu, notifications)
- Main content area
- Mobile bottom navigation (for employees)

// AuthLayout.tsx
- Centered card on gradient background
- Logo header
- Footer with links
```

#### 2. Common Components
```tsx
// Button.tsx - Multiple variants
variants: 'default' | 'outline' | 'ghost' | 'destructive'
sizes: 'sm' | 'md' | 'lg'

// Card.tsx
- Header, Content, Footer sections
- Hover effects
- Shadow variants

// Avatar.tsx
sizes: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- Fallback to initials
- Online status indicator

// Badge.tsx
variants: 'default' | 'success' | 'error' | 'warning' | 'info'

// Input.tsx
- Label support
- Error messages
- Helper text
- Icons (left/right)
- RTL support

// Select.tsx
- Searchable
- Multi-select variant
- Custom option rendering

// DatePicker.tsx
- Single date
- Date range
- RTL calendar

// Modal/Dialog.tsx
- Responsive (full screen on mobile)
- Close on outside click (configurable)
- Animations

// Table.tsx
- Sortable columns
- Selectable rows
- Pagination
- Loading state
- Empty state

// Tabs.tsx
- Horizontal scroll on mobile
- Active indicator
- Icon support

// Toast.tsx
- Success, error, warning, info variants
- Auto-dismiss
- Action button support
```

#### 3. Specialized Components
```tsx
// QRCodeScanner.tsx
- Camera access
- Scanning overlay
- Success/Error feedback

// ColorPicker.tsx (for color-based attendance)
- Large touchable color buttons
- Visual feedback

// OTPInput.tsx
- 4-6 digit input
- Auto-focus next
- Auto-submit

// CountdownTimer.tsx
- Display remaining time
- Color change when urgent (<5 min)
- Auto-expire callback

// PasswordStrength.tsx
- Visual strength meter
- Requirement checklist

// StatusBadge.tsx
- Present, Absent, Late, On Leave
- Color-coded
- Icon support

// MapPreview.tsx
- Show location with marker
- Circle for GPS radius
- Zoom controls
```

---

## 📱 Pages & Routes

### Authentication Routes (`/`)

#### Login Page (`/login`)
**Purpose**: Main entry point for all users

**Layout**: Centered card on gradient background

**Features**:
- Username input (focus on mount)
- Password input (show/hide toggle)
- "Remember me" checkbox
- Login button (with loading state)
- "Forgot password?" link
- Error messages (toast)
- RTL support

**Visual Design**:
```
┌─────────────────────────────────────┐
│                                     │
│     🎯 HADER HR Logo                │
│     Smart Attendance System         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 👤 Username                   │ │
│  │ [ahmad_mohamed           ]    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🔒 Password                   │ │
│  │ [••••••••              ] 👁️  │ │
│  └───────────────────────────────┘ │
│                                     │
│  ☐ Remember me                      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │      🔓 Login                 │ │
│  └───────────────────────────────┘ │
│                                     │
│  📱 Forgot password?                │
│                                     │
└─────────────────────────────────────┘
```

**Functionality**:
```typescript
const handleLogin = async (data: LoginFormData) => {
  try {
    // 1. Validate form
    const validated = loginSchema.parse(data);
    
    // 2. Get user by username
    const { data: user } = await supabase
      .from('users')
      .select('*, employees(*)')
      .eq('username', validated.username)
      .single();
    
    if (!user) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
    
    // 3. Sign in with Supabase Auth
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: validated.password,
    });
    
    if (error) throw error;
    
    // 4. Update last_login_at
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);
    
    // 5. Redirect based on role
    switch (user.role) {
      case 'employee':
        navigate('/employee/dashboard');
        break;
      case 'loc_manager':
        navigate('/manager/dashboard');
        break;
      case 'hr_admin':
        navigate('/hr/dashboard');
        break;
      case 'super_admin':
        navigate('/admin/dashboard');
        break;
    }
    
    toast.success(`مرحباً ${user.full_name}!`);
    
  } catch (error) {
    toast.error(error.message);
  }
};
```

#### Forgot Password Flow (`/forgot-password`)
**3-Step Process**:

**Step 1: Choose Method**
```
┌─────────────────────────────────────┐
│  🔑 Password Recovery               │
├─────────────────────────────────────┤
│                                     │
│  Enter username or phone:           │
│  [ahmad_mohamed            ]        │
│                                     │
│  Choose recovery method:            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📱 WhatsApp (Recommended)  │   │
│  │  Instant delivery           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📧 Email                   │   │
│  │  May take 1-5 minutes       │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Step 2: Enter Verification Code**
```
┌─────────────────────────────────────┐
│  ✅ Code sent successfully!         │
├─────────────────────────────────────┤
│                                     │
│  Code sent to: +966 5X XXX XX45     │
│                                     │
│  Enter 6-digit code:                │
│                                     │
│   [_] [_] [_] [_] [_] [_]          │
│                                     │
│  ⏱️ Expires in: 04:58               │
│                                     │
│  ┌───────────────────────────────┐ │
│  │      ✓ Verify                │ │
│  └───────────────────────────────┘ │
│                                     │
│  Didn't receive?                    │
│  [Resend] (wait 60s)                │
│                                     │
└─────────────────────────────────────┘
```

**Step 3: Set New Password**
```
┌─────────────────────────────────────┐
│  🔒 Set New Password                │
├─────────────────────────────────────┤
│                                     │
│  New password:                      │
│  [•••••••••            ]           │
│                                     │
│  Confirm password:                  │
│  [•••••••••            ]           │
│                                     │
│  💪 Strength: ████████░░ Strong     │
│                                     │
│  Requirements:                      │
│  ✅ At least 8 characters           │
│  ✅ Contains number                 │
│  ✅ Contains uppercase letter       │
│  ☐ Contains special character       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  ✅ Save & Login             │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

### Employee Routes (`/employee/*`)

#### Employee Dashboard (`/employee/dashboard`)
**Purpose**: Main hub for employee - check in/out, view stats, quick actions

**Key Features**:
- Greeting with name and current time
- Large "Check In" button (if not checked in)
- Current status card (if already checked in)
- Quick action cards
- Monthly stats
- Upcoming leaves

**Mobile-Optimized Layout**:
```tsx
<MobileDashboard>
  {/* Header */}
  <Header className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
    <Greeting>👋 مرحباً أحمد</Greeting>
    <DateTime>الأحد، 15 أكتوبر 2025 • 8:23 ص</DateTime>
    <LocationBadge>📍 مستودع الشرق</LocationBadge>
  </Header>

  {/* Main Action - Check In/Out */}
  {!checkedIn ? (
    <CheckInCard className="mx-4 -mt-8 shadow-xl">
      <CardContent className="text-center py-8">
        <StatusIcon>
          <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        </StatusIcon>
        <Title className="text-xl font-bold mb-2">
          لم تسجل حضورك بعد
        </Title>
        <Description className="text-gray-600 mb-6">
          ورديتك: الصباحية (8:00 - 5:00)
        </Description>
        <Button 
          size="lg" 
          className="w-full"
          onClick={goToCheckIn}
        >
          ✅ سجل حضورك الآن
        </Button>
      </CardContent>
    </CheckInCard>
  ) : (
    <StatusCard className="mx-4 -mt-8 shadow-xl">
      <CardContent className="py-6">
        <StatusBadge className="mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          🟢 في العمل
        </StatusBadge>
        <TimeInfo>
          <Label>دخلت الساعة</Label>
          <Value className="text-2xl font-bold">8:15 ص</Value>
        </TimeInfo>
        <Duration className="text-gray-600 mt-2">
          مضى على وجودك: 3 ساعات و 8 دقائق
        </Duration>
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={checkOut}
        >
          ⏱️ تسجيل خروج
        </Button>
      </CardContent>
    </StatusCard>
  )}

  {/* Quick Actions */}
  <QuickActionsGrid className="px-4 mt-6">
    <ActionCard onClick={goToLeaveRequest}>
      <Icon><Calendar className="text-blue-500" /></Icon>
      <Label>طلب إجازة</Label>
    </ActionCard>
    <ActionCard onClick={goToCustomRequest}>
      <Icon><FileText className="text-purple-500" /></Icon>
      <Label>طلب خاص</Label>
    </ActionCard>
    <ActionCard onClick={goToAttendance}>
      <Icon><BarChart className="text-green-500" /></Icon>
      <Label>سجل الحضور</Label>
    </ActionCard>
  </QuickActionsGrid>

  {/* This Month Stats */}
  <Section className="px-4 mt-6">
    <SectionTitle>📊 إحصائيات الشهر</SectionTitle>
    <StatsGrid className="mt-4">
      <StatCard>
        <StatValue>18/20</StatValue>
        <StatLabel>أيام الحضور</StatLabel>
        <Progress value={90} />
      </StatCard>
      <StatCard>
        <StatValue>2</StatValue>
        <StatLabel>مرات التأخير</StatLabel>
      </StatCard>
      <StatCard>
        <StatValue>12</StatValue>
        <StatLabel>رصيد الإجازات</StatLabel>
      </StatCard>
    </StatsGrid>
  </Section>

  {/* Upcoming Leaves */}
  {upcomingLeaves.length > 0 && (
    <Section className="px-4 mt-6">
      <SectionTitle>🏖️ الإجازات القادمة</SectionTitle>
      {upcomingLeaves.map(leave => (
        <LeaveCard key={leave.id}>
          <LeaveType>{leave.type}</LeaveType>
          <LeaveDates>{leave.startDate} - {leave.endDate}</LeaveDates>
          <LeaveDays>{leave.days} أيام</LeaveDays>
        </LeaveCard>
      ))}
    </Section>
  )}
</MobileDashboard>
```

#### Check-In Page (`/employee/check-in`)
**MOST IMPORTANT PAGE - Make it BEAUTIFUL and SIMPLE!**

**Flow**:
1. Show enabled attendance methods
2. User selects method
3. Perform attendance check
4. GPS verification (automatic)
5. Selfie verification (if suspicious)
6. Show success/pending

**Method Selection Screen**:
```tsx
<CheckInPage>
  <Header>
    <BackButton />
    <Title>اختر طريقة التحضير</Title>
  </Header>

  <LocationInfo>
    <Icon><MapPin /></Icon>
    <Text>مستودع الشرق</Text>
    <Badge>في النطاق ✓</Badge>
  </LocationInfo>

  <MethodsGrid>
    {enabledMethods.includes('qr') && (
      <MethodCard 
        onClick={() => selectMethod('qr')}
        className="bg-gradient-to-br from-blue-50 to-blue-100"
      >
        <Icon><QrCode className="w-12 h-12 text-blue-600" /></Icon>
        <Title>مسح QR Code</Title>
        <Description>الأسرع - مسح فوري</Description>
        <Badge>موصى به</Badge>
      </MethodCard>
    )}

    {enabledMethods.includes('color') && (
      <MethodCard 
        onClick={() => selectMethod('color')}
        className="bg-gradient-to-br from-purple-50 to-purple-100"
      >
        <Icon><Palette className="w-12 h-12 text-purple-600" /></Icon>
        <Title>اختيار اللون</Title>
        <Description>بسيط جداً</Description>
      </MethodCard>
    )}

    {enabledMethods.includes('code') && (
      <MethodCard 
        onClick={() => selectMethod('code')}
        className="bg-gradient-to-br from-green-50 to-green-100"
      >
        <Icon><Hash className="w-12 h-12 text-green-600" /></Icon>
        <Title>إدخال الكود</Title>
        <Description>4 أرقام فقط</Description>
      </MethodCard>
    )}
  </MethodsGrid>

  <InfoNote>
    💡 GPS سيتم تسجيله تلقائياً لضمان الأمان
  </InfoNote>
</CheckInPage>
```

**QR Scanner Screen**:
```tsx
<QRScannerPage>
  <Header>
    <BackButton />
    <Title>مسح QR Code</Title>
  </Header>

  <ScannerContainer>
    <video ref={videoRef} autoPlay playsInline />
    <ScanningBox>
      <Corner position="top-left" />
      <Corner position="top-right" />
      <Corner position="bottom-left" />
      <Corner position="bottom-right" />
      <ScanLine className="animate-scan" />
    </ScanningBox>
    <Instructions>
      وجّه الكاميرا نحو رمز QR
    </Instructions>
  </ScannerContainer>

  <CancelButton onClick={goBack}>
    إلغاء
  </CancelButton>
</QRScannerPage>
```

**Color Selection Screen**:
```tsx
<ColorSelectionPage>
  <Header>
    <BackButton />
    <Title>اختر اللون</Title>
  </Header>

  <Instructions>
    اختر اللون الظاهر على شاشة مدير الموقع
  </Instructions>

  <ColorGrid>
    {availableColors.map(color => (
      <ColorButton
        key={color}
        color={color}
        onClick={() => submitColor(color)}
        className={`
          w-32 h-32 rounded-3xl shadow-2xl
          hover:scale-110 transition-transform
          active:scale-95
        `}
        style={{ backgroundColor: color }}
      >
        <ColorName>{getColorName(color)}</ColorName>
      </ColorButton>
    ))}
  </ColorGrid>
</ColorSelectionPage>
```

**Code Entry Screen**:
```tsx
<CodeEntryPage>
  <Header>
    <BackButton />
    <Title>أدخل الكود</Title>
  </Header>

  <Instructions>
    أدخل الكود المكون من 4 أرقام
  </Instructions>

  <OTPInput
    length={4}
    value={code}
    onChange={setCode}
    autoFocus
    className="text-4xl"
  />

  <NumericKeypad>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map((key) => (
      <KeypadButton
        key={key}
        onClick={() => handleKeyPress(key)}
      >
        {key}
      </KeypadButton>
    ))}
  </NumericKeypad>
</CodeEntryPage>
```

**Verification & Processing**:
```typescript
const processAttendance = async (method: string, data: any) => {
  try {
    // 1. Get current GPS position
    const gpsPosition = await getCurrentPosition();
    
    // 2. Verify method (QR/Color/Code)
    const methodValid = await verifyAttendanceMethod(method, data);
    
    if (!methodValid) {
      throw new Error('طريقة التحضير غير صحيحة');
    }
    
    // 3. Calculate GPS distance from location
    const distance = calculateDistance(
      gpsPosition,
      { lat: locationLat, lng: locationLng }
    );
    
    // 4. Calculate suspicion score
    const suspicionScore = calculateSuspicionScore({
      gpsDistance: distance,
      gpsRequired: locationSettings.gps.required,
      gpsRadius: locationSettings.gps.radius,
      checkInTime: new Date(),
      expectedTime: shiftStartTime,
      employeeHistory: recentAttendance,
    });
    
    // 5. Decide if selfie needed
    const needsSelfie = 
      locationSettings.selfie.mode === 'always' ||
      (locationSettings.selfie.mode === 'on_suspicion' && 
       suspicionScore >= locationSettings.suspicion.threshold);
    
    if (needsSelfie) {
      // Show selfie capture screen
      return { requiresSelfie: true };
    }
    
    // 6. Create attendance record
    const { data: record, error } = await supabase
      .from('attendance_records')
      .insert({
        company_id: companyId,
        branch_id: branchId,
        location_id: locationId,
        employee_id: userId,
        shift_id: shiftId,
        check_in: new Date().toISOString(),
        method_used: method,
        method_data: data,
        gps_lat: gpsPosition.latitude,
        gps_lng: gpsPosition.longitude,
        gps_distance: distance,
        gps_accuracy: gpsPosition.accuracy,
        suspicious_score: suspicionScore,
        suspicious_reasons: getSuspiciousReasons(suspicionScore),
        status: suspicionScore >= threshold ? 'suspicious' : 'approved',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 7. If suspicious, create verification request
    if (record.status === 'suspicious') {
      await createVerificationRequest(record);
    }
    
    // 8. Send WhatsApp confirmation (async)
    sendWhatsAppConfirmation(user, record);
    
    return { success: true, record };
    
  } catch (error) {
    console.error('Attendance error:', error);
    throw error;
  }
};
```

**Success Screen**:
```tsx
<SuccessPage>
  <SuccessAnimation>
    <Confetti />
    <CheckCircle className="w-32 h-32 text-green-500 animate-scale-in" />
  </SuccessAnimation>

  <Title className="text-2xl font-bold text-green-600">
    ✅ تم تسجيل حضورك بنجاح!
  </Title>

  <DetailsCard>
    <DetailRow>
      <Label>⏰ الوقت</Label>
      <Value>8:15:23 صباحاً</Value>
    </DetailRow>
    <DetailRow>
      <Label>📍 الموقع</Label>
      <Value>مستودع الشرق</Value>
    </DetailRow>
    <DetailRow>
      <Label>📱 الطريقة</Label>
      <Value>QR Code</Value>
    </DetailRow>
    <DetailRow>
      <Label>🌍 المسافة</Label>
      <Value>داخل النطاق (45م)</Value>
    </DetailRow>
  </DetailsCard>

  {isLate && (
    <Alert variant="warning">
      <Clock />
      <AlertTitle>تأخرت 10 دقائق</AlertTitle>
      <AlertDescription>
        يُرجى الالتزام بمواعيد العمل
      </AlertDescription>
    </Alert>
  )}

  <MessageCard>
    <Icon>💼</Icon>
    <Text>يوم عمل موفق!</Text>
  </MessageCard>

  <Button onClick={goToDashboard} className="w-full">
    العودة للرئيسية
  </Button>
</SuccessPage>
```

**Pending Verification Screen** (for suspicious attendance):
```tsx
<PendingPage>
  <StatusIcon>
    <Hourglass className="w-24 h-24 text-amber-500 animate-pulse" />
  </StatusIcon>

  <Title className="text-xl font-bold">
    ⏳ يحتاج موافقة المدير
  </Title>

  <Alert variant="warning">
    <AlertTriangle />
    <AlertDescription>
      تم إرسال طلب تأكيد للمدير.
      سيتم الرد خلال 20 دقيقة.
    </AlertDescription>
  </Alert>

  <ReasonCard>
    <ReasonTitle>سبب الطلب:</ReasonTitle>
    {suspiciousReasons.map(reason => (
      <ReasonItem key={reason.type}>
        <ReasonIcon>{getReasonIcon(reason.type)}</ReasonIcon>
        <ReasonText>{reason.text}</ReasonText>
      </ReasonItem>
    ))}
  </ReasonCard>

  <CountdownTimer expiresAt={expiresAt} />

  <InfoNote>
    💡 ستتلقى إشعار WhatsApp عند الموافقة
  </InfoNote>

  <Button onClick={goToDashboard}>
    حسناً
  </Button>
</PendingPage>
```

**Selfie Capture Screen**:
```tsx
<SelfiePage>
  <Header>
    <Title>📸 تأكيد الهوية</Title>
  </Header>

  <Alert variant="info">
    <Info />
    <AlertDescription>
      يُرجى التقاط صورة سيلفي واضحة للتأكيد
    </AlertDescription>
  </Alert>

  <CameraPreview>
    <video ref={videoRef} autoPlay playsInline />
    <FaceOutline />
    <canvas ref={canvasRef} style={{ display: 'none' }} />
  </CameraPreview>

  <Instructions>
    <InstructionItem>
      <CheckCircle className="text-green-500" />
      <Text>تأكد من الإضاءة الجيدة</Text>
    </InstructionItem>
    <InstructionItem>
      <CheckCircle className="text-green-500" />
      <Text>انظر مباشرة للكاميرا</Text>
    </InstructionItem>
    <InstructionItem>
      <CheckCircle className="text-green-500" />
      <Text>أزل النظارات والقبعة</Text>
    </InstructionItem>
  </Instructions>

  <Actions>
    <Button 
      size="lg" 
      onClick={captureSelfie}
      className="w-full"
    >
      📷 التقط الصورة
    </Button>
    <Button 
      variant="outline" 
      onClick={switchCamera}
    >
      🔄 تبديل الكاميرا
    </Button>
  </Actions>
</SelfiePage>
```

#### Attendance History (`/employee/attendance`)
**Features**:
- Calendar view + List view toggle
- Monthly stats summary
- Filter by date range
- Color-coded days (present, late, absent, leave)
- Click day for details

```tsx
<AttendanceHistory>
  {/* View Toggle */}
  <ViewToggle>
    <ToggleButton 
      active={view === 'calendar'}
      onClick={() => setView('calendar')}
    >
      📅 تقويم
    </ToggleButton>
    <ToggleButton 
      active={view === 'list'}
      onClick={() => setView('list')}
    >
      📋 قائمة
    </ToggleButton>
  </ViewToggle>

  {/* Month Selector */}
  <MonthSelector>
    <IconButton onClick={previousMonth}>
      <ChevronLeft />
    </IconButton>
    <MonthLabel>{currentMonth}</MonthLabel>
    <IconButton onClick={nextMonth}>
      <ChevronRight />
    </IconButton>
  </MonthSelector>

  {/* Stats Summary */}
  <StatsCard>
    <StatItem>
      <StatValue>18/20</StatValue>
      <StatLabel>أيام الحضور</StatLabel>
    </StatItem>
    <StatItem>
      <StatValue>90%</StatValue>
      <StatLabel>معدل الحضور</StatLabel>
    </StatItem>
    <StatItem>
      <StatValue>2</StatValue>
      <StatLabel>مرات التأخير</StatLabel>
    </StatItem>
    <StatItem>
      <StatValue>0</StatValue>
      <StatLabel>غياب</StatLabel>
    </StatItem>
  </StatsCard>

  {view === 'calendar' ? (
    <CalendarView>
      <Calendar>
        <CalendarHeader>
          <DayName>س</DayName>
          <DayName>ح</DayName>
          <DayName>ن</DayName>
          <DayName>ث</DayName>
          <DayName>ر</DayName>
          <DayName>خ</DayName>
          <DayName>ج</DayName>
        </CalendarHeader>
        <CalendarBody>
          {days.map(day => (
            <DayCell
              key={day.date}
              status={day.status}
              onClick={() => showDayDetails(day)}
              className={cn(
                day.status === 'present' && 'bg-green-100 border-green-500',
                day.status === 'late' && 'bg-amber-100 border-amber-500',
                day.status === 'absent' && 'bg-red-100 border-red-500',
                day.status === 'leave' && 'bg-blue-100 border-blue-500',
              )}
            >
              <DayNumber>{day.number}</DayNumber>
              <StatusIcon status={day.status} size={16} />
            </DayCell>
          ))}
        </CalendarBody>
      </Calendar>

      <Legend>
        <LegendItem>
          <ColorBox className="bg-green-500" />
          <Label>حضور في الوقت</Label>
        </LegendItem>
        <LegendItem>
          <ColorBox className="bg-amber-500" />
          <Label>تأخر</Label>
        </LegendItem>
        <LegendItem>
          <ColorBox className="bg-red-500" />
          <Label>غياب</Label>
        </LegendItem>
        <LegendItem>
          <ColorBox className="bg-blue-500" />
          <Label>إجازة</Label>
        </LegendItem>
      </Legend>
    </CalendarView>
  ) : (
    <ListView>
      {records.map(record => (
        <RecordCard key={record.id}>
          <RecordHeader>
            <DateBadge>{formatDate(record.checkIn)}</DateBadge>
            <StatusBadge status={record.status} />
          </RecordHeader>
          <RecordBody>
            <TimeRow>
              <Label>⏰ الحضور</Label>
              <Value>{formatTime(record.checkIn)}</Value>
            </TimeRow>
            <TimeRow>
              <Label>⏰ الانصراف</Label>
              <Value>
                {record.checkOut ? formatTime(record.checkOut) : 'لم ينصرف'}
              </Value>
            </TimeRow>
            <TimeRow>
              <Label>⏱️ ساعات العمل</Label>
              <Value>{record.workHours} ساعة</Value>
            </TimeRow>
          </RecordBody>
          {record.notes && (
            <RecordFooter>
              <NotesIcon><MessageCircle size={14} /></NotesIcon>
              <NotesText>{record.notes}</NotesText>
            </RecordFooter>
          )}
        </RecordCard>
      ))}
    </ListView>
  )}
</AttendanceHistory>
```

#### Leave Request (`/employee/leave-request`)
**Features**:
- Select leave type
- Pick date range
- Auto-calculate days
- Show balance
- Submit request
- View previous requests

```tsx
<LeaveRequestPage>
  <PageHeader>
    <Title>📝 طلب إجازة</Title>
  </PageHeader>

  <Form onSubmit={handleSubmit(submitLeaveRequest)}>
    <FormSection>
      <Select
        label="نوع الإجازة"
        {...register('leaveType')}
        error={errors.leaveType?.message}
      >
        <option value="annual">🏖️ إجازة سنوية</option>
        <option value="sick">🤒 إجازة مرضية</option>
        <option value="personal">👤 إجازة شخصية</option>
        <option value="emergency">🚨 إجازة طارئة</option>
        <option value="unpaid">💰 إجازة بدون راتب</option>
      </Select>

      <DateRangePicker
        label="فترة الإجازة"
        startDate={startDate}
        endDate={endDate}
        onChange={handleDateChange}
        minDate={new Date()}
        error={errors.dates?.message}
      />

      <DaysCalculator className="bg-primary-50 p-4 rounded-lg">
        <Label>عدد أيام الإجازة:</Label>
        <Value className="text-2xl font-bold text-primary-600">
          {calculateDays(startDate, endDate)} يوم
        </Value>
      </DaysCalculator>

      <BalanceCard>
        <BalanceInfo>
          <Icon><Calendar /></Icon>
          <div>
            <BalanceLabel>رصيدك الحالي</BalanceLabel>
            <BalanceValue>
              {getBalanceForType(leaveType)} يوم
            </BalanceValue>
          </div>
        </BalanceInfo>
        {!hasEnoughBalance && (
          <Alert variant="error">
            <AlertCircle />
            <AlertDescription>
              ليس لديك رصيد كافٍ لهذا النوع من الإجازة
            </AlertDescription>
          </Alert>
        )}
      </BalanceCard>

      <Textarea
        label="السبب (اختياري)"
        placeholder="اكتب سبب الإجازة هنا..."
        rows={4}
        {...register('reason')}
      />

      <SubmitButton
        type="submit"
        disabled={!hasEnoughBalance || isSubmitting}
        isLoading={isSubmitting}
      >
        📤 إرسال الطلب
      </SubmitButton>
    </FormSection>
  </Form>

  {/* Previous Requests */}
  <Section className="mt-8">
    <SectionTitle>📋 طلباتك السابقة</SectionTitle>
    {previousRequests.length === 0 ? (
      <EmptyState>
        <Icon><Calendar className="w-16 h-16 text-gray-300" /></Icon>
        <Text>لا توجد طلبات سابقة</Text>
      </EmptyState>
    ) : (
      <RequestsList>
        {previousRequests.map(request => (
          <RequestCard key={request.id}>
            <CardHeader>
              <LeaveTypeBadge type={request.leaveType} />
              <StatusBadge status={request.status} />
            </CardHeader>
            <CardBody>
              <DateRange>
                {formatDate(request.startDate)} - {formatDate(request.endDate)}
              </DateRange>
              <Days>{request.days} أيام</Days>
              {request.reason && (
                <Reason>{request.reason}</Reason>
              )}
            </CardBody>
            {request.status === 'pending' && (
              <CardFooter>
                <CancelButton 
                  onClick={() => cancelRequest(request.id)}
                  variant="outline"
                  size="sm"
                >
                  إلغاء الطلب
                </CancelButton>
              </CardFooter>
            )}
            {request.status === 'rejected' && request.rejectionReason && (
              <RejectionNote>
                <Label>سبب الرفض:</Label>
                <Text>{request.rejectionReason}</Text>
              </RejectionNote>
            )}
          </RequestCard>
        ))}
      </RequestsList>
    )}
  </Section>
</LeaveRequestPage>
```

#### Custom Request (`/employee/custom-request`)
**Purpose**: For any special request (certificate, report, inquiry, etc.)

```tsx
<CustomRequestPage>
  <PageHeader>
    <Title>📋 طلب خاص</Title>
    <Description>
      استخدم هذا النموذج لأي طلب خاص
      (شهادة راتب، تقرير، استفسار، إلخ)
    </Description>
  </PageHeader>

  <Form onSubmit={handleSubmit(submitCustomRequest)}>
    <Input
      label="عنوان الطلب"
      placeholder="مثال: طلب شهادة راتب"
      {...register('title')}
      error={errors.title?.message}
      required
    />

    <Textarea
      label="الوصف"
      placeholder="اكتب تفاصيل طلبك هنا..."
      rows={6}
      {...register('description')}
      error={errors.description?.message}
      required
    />

    <FileUpload
      label="إرفاق ملف أو صورة (اختياري)"
      accept="image/*,.pdf,.doc,.docx"
      maxSize={5 * 1024 * 1024} // 5MB
      onChange={handleFileUpload}
    />

    {uploadedFile && (
      <FilePreview>
        <FileIcon type={uploadedFile.type} />
        <FileInfo>
          <FileName>{uploadedFile.name}</FileName>
          <FileSize>{formatFileSize(uploadedFile.size)}</FileSize>
        </FileInfo>
        <RemoveButton onClick={removeFile}>
          <X size={16} />
        </RemoveButton>
      </FilePreview>
    )}

    <SubmitButton
      type="submit"
      isLoading={isSubmitting}
    >
      📤 إرسال الطلب
    </SubmitButton>
  </Form>

  {/* Previous Custom Requests */}
  <Section className="mt-8">
    <SectionTitle>📋 طلباتك السابقة</SectionTitle>
    {customRequests.length === 0 ? (
      <EmptyState>
        <Icon><FileText className="w-16 h-16 text-gray-300" /></Icon>
        <Text>لا توجد طلبات سابقة</Text>
      </EmptyState>
    ) : (
      <RequestsList>
        {customRequests.map(request => (
          <CustomRequestCard key={request.id}>
            <CardHeader>
              <Title>{request.title}</Title>
              <StatusBadge status={request.status} />
            </CardHeader>
            <CardBody>
              <Description>{request.description}</Description>
              <Metadata>
                <DateLabel>{formatDate(request.createdAt)}</DateLabel>
                {request.attachmentUrl && (
                  <AttachmentBadge>
                    <Paperclip size={12} />
                    مرفق
                  </AttachmentBadge>
                )}
              </Metadata>
            </CardBody>
            {request.response && (
              <Response>
                <ResponseHeader>
                  <Icon><MessageSquare size={16} /></Icon>
                  <Label>الرد من الإدارة:</Label>
                </ResponseHeader>
                <ResponseText>{request.response}</ResponseText>
                <ResponseDate>
                  {formatDate(request.reviewedAt)}
                </ResponseDate>
              </Response>
            )}
          </CustomRequestCard>
        ))}
      </RequestsList>
    )}
  </Section>
</CustomRequestPage>
```

#### Profile Page (`/employee/profile`)
```tsx
<ProfilePage>
  <ProfileHeader>
    <AvatarUpload
      currentAvatar={avatar}
      onUpload={handleAvatarUpload}
      size="xl"
    />
    <UserInfo>
      <Name>{fullName}</Name>
      <Role>موظف</Role>
      <EmployeeNumber>#{employeeNumber}</EmployeeNumber>
    </UserInfo>
  </ProfileHeader>

  <Tabs defaultValue="personal">
    <TabsList>
      <TabsTrigger value="personal">
        <User size={16} />
        البيانات الشخصية
      </TabsTrigger>
      <TabsTrigger value="work">
        <Briefcase size={16} />
        بيانات العمل
      </TabsTrigger>
      <TabsTrigger value="security">
        <Lock size={16} />
        الأمان
      </TabsTrigger>
    </TabsList>

    <TabsContent value="personal">
      <Form onSubmit={handleSubmit(updatePersonalInfo)}>
        <Input
          label="الاسم الكامل"
          value={fullName}
          readOnly
          disabled
        />
        <Input
          label="البريد الإلكتروني"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="رقم الجوال"
          type="tel"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <SaveButton type="submit" isLoading={isUpdating}>
          💾 حفظ التغييرات
        </SaveButton>
      </Form>
    </TabsContent>

    <TabsContent value="work">
      <InfoGrid>
        <InfoItem>
          <Label>الرقم الوظيفي</Label>
          <Value>{employeeNumber}</Value>
        </InfoItem>
        <InfoItem>
          <Label>القسم</Label>
          <Value>{department || '-'}</Value>
        </InfoItem>
        <InfoItem>
          <Label>المسمى الوظيفي</Label>
          <Value>{position || '-'}</Value>
        </InfoItem>
        <InfoItem>
          <Label>تاريخ التعيين</Label>
          <Value>{formatDate(hireDate)}</Value>
        </InfoItem>
        <InfoItem>
          <Label>الموقع</Label>
          <Value>{location.name}</Value>
        </InfoItem>
        <InfoItem>
          <Label>الوردية</Label>
          <Value>{shift?.name || '-'}</Value>
        </InfoItem>
        <InfoItem>
          <Label>رصيد الإجازات السنوية</Label>
          <Value>{vacationBalance} يوم</Value>
        </InfoItem>
        <InfoItem>
          <Label>رصيد الإجازات المرضية</Label>
          <Value>{sickLeaveBalance} يوم</Value>
        </InfoItem>
      </InfoGrid>
    </TabsContent>

    <TabsContent value="security">
      <ChangePasswordForm onSubmit={handleSubmit(changePassword)}>
        <Input
          label="كلمة المرور الحالية"
          type="password"
          {...register('currentPassword')}
          error={errors.currentPassword?.message}
          required
        />
        <Input
          label="كلمة المرور الجديدة"
          type="password"
          {...register('newPassword')}
          error={errors.newPassword?.message}
          required
        />
        <PasswordStrength strength={getPasswordStrength(watch('newPassword'))} />
        <Input
          label="تأكيد كلمة المرور"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          required
        />
        <SaveButton type="submit" isLoading={isChanging}>
          🔒 تغيير كلمة المرور
        </SaveButton>
      </ChangePasswordForm>
    </TabsContent>
  </Tabs>
</ProfilePage>
```

---

### Location Manager Routes (`/manager/*`)

#### Manager Dashboard (`/manager/dashboard`)
**Purpose**: Display attendance codes + monitor today's attendance

**CRITICAL**: This page should show the QR/Color/Code prominently so employees can check in easily!

```tsx
<ManagerDashboard>
  <PageHeader>
    <LocationInfo>
      <Icon><MapPin /></Icon>
      <LocationName>مستودع الشرق</LocationName>
    </LocationInfo>
    <DateTime>{currentDateTime}</DateTime>
  </PageHeader>

  {/* Method Selector */}
  <MethodSelector>
    <Label>طريقة التحضير النشطة:</Label>
    <Select 
      value={activeMethod}
      onChange={setActiveMethod}
      options={enabledMethods.map(m => ({
        value: m,
        label: getMethodName(m)
      }))}
    />
  </MethodSelector>

  {/* Main Display - Large and Clear */}
  <AttendanceDisplay method={activeMethod}>
    {activeMethod === 'qr' && (
      <QRDisplay>
        <QRCode 
          value={currentQR} 
          size={300}
          level="H"
        />
        <RefreshTimer>
          <Clock className="animate-pulse" />
          يتجدد خلال: <CountdownText>{countdown}</CountdownText>
        </RefreshTimer>
      </QRDisplay>
    )}

    {activeMethod === 'color' && (
      <ColorDisplay>
        <ColorCircle
          color={currentColor}
          className="w-64 h-64 rounded-full shadow-2xl animate-pulse"
        />
        <ColorName className="text-3xl font-bold mt-4">
          {getColorNameArabic(currentColor)}
        </ColorName>
        <RefreshTimer>
          <Clock />
          يتغير خلال: <CountdownText>{countdown}</CountdownText>
        </RefreshTimer>
      </ColorDisplay>
    )}

    {activeMethod === 'code' && (
      <CodeDisplay>
        <CodeDigits>
          {currentCode.split('').map((digit, i) => (
            <Digit key={i} className="text-8xl font-bold">
              {digit}
            </Digit>
          ))}
        </CodeDigits>
        <RefreshTimer>
          <Clock />
          يتجدد خلال: <CountdownText>{countdown}</CountdownText>
        </RefreshTimer>
      </CodeDisplay>
    )}
  </AttendanceDisplay>

  {/* Alternative Methods Preview */}
  {alternativeMethods.length > 0 && (
    <AlternativeMethods>
      <Label>الطرق الأخرى المتاحة:</Label>
      <MethodGrid>
        {alternativeMethods.map(method => (
          <MethodPreview
            key={method}
            method={method}
            onClick={() => setActiveMethod(method)}
          />
        ))}
      </MethodGrid>
    </AlternativeMethods>
  )}

  {/* Today's Stats */}
  <StatsSection>
    <StatCard className="col-span-2">
      <StatValue>{presentCount}/{totalCount}</StatValue>
      <StatLabel>الحضور اليوم</StatLabel>
      <Progress value={attendancePercentage} className="mt-2" />
    </StatCard>
    <StatCard>
      <Icon><CheckCircle className="text-green-500" /></Icon>
      <StatValue>{presentCount}</StatValue>
      <StatLabel>حاضر</StatLabel>
    </StatCard>
    <StatCard>
      <Icon><XCircle className="text-red-500" /></Icon>
      <StatValue>{absentCount}</StatValue>
      <StatLabel>غائب</StatLabel>
    </StatCard>
    <StatCard>
      <Icon><Clock className="text-amber-500" /></Icon>
      <StatValue>{lateCount}</StatValue>
      <StatLabel>متأخر</StatLabel>
    </StatCard>
  </StatsSection>

  {/* Suspicious Attendance Alerts */}
  {suspiciousCount > 0 && (
    <AlertSection>
      <AlertHeader>
        <Icon><AlertTriangle className="text-amber-500" /></Icon>
        <Title>يحتاج تأكيدك ({suspiciousCount})</Title>
        <ViewAllButton onClick={goToVerifications}>
          عرض الكل →
        </ViewAllButton>
      </AlertHeader>
      {suspiciousRecords.slice(0, 3).map(record => (
        <SuspiciousCard key={record.id}>
          <EmployeeInfo>
            <Avatar src={record.employee.avatar} size="sm" />
            <Name>{record.employee.name}</Name>
          </EmployeeInfo>
          <AlertReason>
            <Icon><AlertCircle size={14} /></Icon>
            <Text>{record.suspiciousReasons[0]?.text}</Text>
          </AlertReason>
          <TimeLeft urgent={getMinutesLeft(record.expiresAt) < 5}>
            <Hourglass size={14} />
            {getTimeLeft(record.expiresAt)}
          </TimeLeft>
          <Button
            variant="outline"
            size="sm"
            onClick={() => viewDetails(record)}
          >
            تفاصيل
          </Button>
        </SuspiciousCard>
      ))}
    </AlertSection>
  )}

  {/* Recent Check-ins */}
  <Section>
    <SectionTitle>📋 آخر التسجيلات</SectionTitle>
    <CheckInsList>
      {recentCheckIns.map(record => (
        <CheckInItem key={record.id}>
          <Avatar src={record.employee.avatar} size="sm" />
          <Info>
            <Name>{record.employee.name}</Name>
            <Time>{formatTime(record.checkIn)}</Time>
          </Info>
          <MethodBadge method={record.method} />
          <StatusIcon status={record.status} />
        </CheckInItem>
      ))}
    </CheckInsList>
  </Section>

  {/* Quick Actions */}
  <QuickActions>
    <ActionButton onClick={goToVerifications}>
      <AlertCircle />
      طلبات التأكيد
      {suspiciousCount > 0 && (
        <Badge>{suspiciousCount}</Badge>
      )}
    </ActionButton>
    <ActionButton onClick={goToManualCheckIn}>
      <Edit />
      تسجيل يدوي
    </ActionButton>
    <ActionButton onClick={goToTodayReport}>
      <FileText />
      تقرير اليوم
    </ActionButton>
  </QuickActions>
</ManagerDashboard>
```

**Background Logic for Dynamic Codes**:
```typescript
// Auto-refresh codes based on settings
useEffect(() => {
  const refreshCode = async () => {
    const settings = locationSettings.attendance_methods[activeMethod];
    
    if (activeMethod === 'qr') {
      // Generate new QR code
      const newCode = generateSecureCode();
      const expiresAt = new Date(Date.now() + settings.refresh_interval * 1000);
      
      await supabase.from('qr_codes').insert({
        location_id: locationId,
        code_data: newCode,
        expires_at: expiresAt.toISOString(),
      });
      
      setCurrentQR(newCode);
      setCountdown(settings.refresh_interval);
    }
    
    else if (activeMethod === 'color') {
      // Change color
      const colors = settings.colors;
      const newColor = colors[Math.floor(Math.random() * colors.length)];
      const expiresAt = new Date(Date.now() + settings.refresh_interval * 1000);
      
      await supabase.from('color_codes').insert({
        location_id: locationId,
        current_color: newColor,
        expires_at: expiresAt.toISOString(),
      });
      
      setCurrentColor(newColor);
      setCountdown(settings.refresh_interval);
    }
    
    else if (activeMethod === 'code') {
      // Generate new numeric code
      const newCode = generateNumericCode(settings.digits);
      const expiresAt = new Date(Date.now() + settings.refresh_interval * 1000);
      
      await supabase.from('numeric_codes').insert({
        location_id: locationId,
        code: newCode,
        expires_at: expiresAt.toISOString(),
      });
      
      setCurrentCode(newCode);
      setCountdown(settings.refresh_interval);
    }
  };
  
  // Initial load
  refreshCode();
  
  // Set interval to refresh
  const interval = setInterval(() => {
    refreshCode();
  }, settings.refresh_interval * 1000);
  
  return () => clearInterval(interval);
}, [activeMethod, locationId]);

// Countdown timer
useEffect(() => {
  if (countdown <= 0) return;
  
  const timer = setInterval(() => {
    setCountdown(prev => Math.max(0, prev - 1));
  }, 1000);
  
  return () => clearInterval(timer);
}, [countdown]);
```

#### Verification Requests (`/manager/verifications`)
**Purpose**: Review and approve/reject suspicious attendance

```tsx
<VerificationRequests>
  <PageHeader>
    <Title>⚠️ طلبات التأكيد</Title>
    <Filters>
      <FilterButton 
        active={filter === 'pending'}
        onClick={() => setFilter('pending')}
      >
        قيد الانتظار ({pendingCount})
      </FilterButton>
      <FilterButton 
        active={filter === 'all'}
        onClick={() => setFilter('all')}
      >
        الكل
      </FilterButton>
    </Filters>
  </PageHeader>

  {filteredRequests.length === 0 ? (
    <EmptyState>
      <CheckCircle className="w-24 h-24 text-green-500" />
      <Title>لا توجد طلبات تأكيد</Title>
      <Description>
        جميع حالات الحضور تمت الموافقة عليها تلقائياً
      </Description>
    </EmptyState>
  ) : (
    <RequestsList>
      {filteredRequests.map(request => (
        <VerificationCard key={request.id}>
          {/* Employee Info + Timer */}
          <CardHeader>
            <EmployeeInfo>
              <Avatar src={request.employee.avatar} size="lg" />
              <div>
                <Name>{request.employee.name}</Name>
                <EmployeeNumber>#{request.employee.number}</EmployeeNumber>
              </div>
            </EmployeeInfo>
            <Timer urgent={getMinutesLeft(request.expiresAt) < 5}>
              <Hourglass className="animate-pulse" />
              <TimeLeft>{getTimeLeft(request.expiresAt)}</TimeLeft>
            </Timer>
          </CardHeader>

          {/* Attendance Details */}
          <AttendanceDetails>
            <DetailRow>
              <Label>⏰ الوقت</Label>
              <Value>{formatDateTime(request.record.checkIn)}</Value>
            </DetailRow>
            <DetailRow>
              <Label>📱 الطريقة</Label>
              <Value>{getMethodName(request.record.method)}</Value>
            </DetailRow>
            <DetailRow>
              <Label>📍 الموقع</Label>
              <Value>{request.record.location.name}</Value>
            </DetailRow>
          </AttendanceDetails>

          {/* Suspicion Analysis */}
          <SuspicionSection>
            <SectionHeader>
              <Icon><Brain /></Icon>
              <Title>تحليل الشك</Title>
              <Score status={getSuspicionLevel(request.suspiciousScore)}>
                {request.suspiciousScore}/100
              </Score>
            </SectionHeader>
            <ProgressBar 
              value={request.suspiciousScore}
              className={cn(
                request.suspiciousScore < 50 && 'bg-green-500',
                request.suspiciousScore >= 50 && request.suspiciousScore < 75 && 'bg-amber-500',
                request.suspiciousScore >= 75 && 'bg-red-500',
              )}
            />
            <ReasonsList>
              {request.suspiciousReasons.map((reason, i) => (
                <ReasonItem key={i}>
                  <ReasonIcon>{getReasonIcon(reason.type)}</ReasonIcon>
                  <ReasonText>{reason.text}</ReasonText>
                  <ReasonScore>+{reason.points}</ReasonScore>
                </ReasonItem>
              ))}
            </ReasonsList>
          </SuspicionSection>

          {/* GPS Info */}
          {request.record.gpsLat && (
            <GPSSection>
              <SectionTitle>📍 بيانات الموقع</SectionTitle>
              <MapContainer>
                {/* Simple map with marker - use react-leaflet or similar */}
                <MapPreview
                  center={[request.record.gpsLat, request.record.gpsLng]}
                  marker={[request.record.gpsLat, request.record.gpsLng]}
                  locationCenter={[request.record.location.lat, request.record.location.lng]}
                  radius={request.record.location.gpsRadius}
                />
              </MapContainer>
              <DistanceInfo 
                warning={request.record.gpsDistance > request.record.location.gpsRadius}
              >
                📍 المسافة من الموقع: 
                <strong>{request.record.gpsDistance}م</strong>
                {request.record.gpsDistance > request.record.location.gpsRadius && (
                  <Badge variant="warning">خارج النطاق</Badge>
                )}
              </DistanceInfo>
            </GPSSection>
          )}

          {/* Selfie */}
          {request.record.selfieUrl && (
            <SelfieSection>
              <SectionTitle>📸 صورة التأكيد</SectionTitle>
              <SelfieImage
                src={request.record.selfieUrl}
                onClick={() => openImageModal(request.record.selfieUrl)}
              />
              {request.record.selfieData && (
                <FaceMatchInfo>
                  <MatchScore 
                    high={request.record.selfieData.faceMatch > 85}
                  >
                    مطابقة الوجه: {request.record.selfieData.faceMatch}%
                  </MatchScore>
                  {request.record.selfieData.liveness && (
                    <LivenessCheck>
                      <CheckCircle size={14} className="text-green-500" />
                      تم التحقق من الحياة
                    </LivenessCheck>
                  )}
                </FaceMatchInfo>
              )}
            </SelfieSection>
          )}

          {/* Notes */}
          <NotesSection>
            <Label>ملاحظات (اختياري):</Label>
            <Textarea
              placeholder="أضف ملاحظات للموظف..."
              value={notes[request.id] || ''}
              onChange={(e) => setNotes(prev => ({
                ...prev,
                [request.id]: e.target.value
              }))}
              rows={3}
            />
          </NotesSection>

          {/* Actions */}
          <Actions>
            <Button
              size="lg"
              onClick={() => approveRequest(request.id, notes[request.id])}
              disabled={isProcessing === request.id}
              isLoading={isProcessing === request.id && action === 'approve'}
            >
              <CheckCircle />
              ✅ تأكيد الحضور
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => rejectRequest(request.id, notes[request.id])}
              disabled={isProcessing === request.id}
              isLoading={isProcessing === request.id && action === 'reject'}
            >
              <XCircle />
              ❌ رفض الحضور
            </Button>
          </Actions>
        </VerificationCard>
      ))}
    </RequestsList>
  )}
</VerificationRequests>
```

**Approve/Reject Logic**:
```typescript
const approveRequest = async (requestId: string, notes?: string) => {
  try {
    setIsProcessing(requestId);
    setAction('approve');
    
    // 1. Update verification request
    const { error: verifyError } = await supabase
      .from('verification_requests')
      .update({
        status: 'approved',
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
        manager_id: currentUserId,
      })
      .eq('id', requestId);
    
    if (verifyError) throw verifyError;
    
    // 2. Update attendance record
    const { data: request } = await supabase
      .from('verification_requests')
      .select('attendance_record_id')
      .eq('id', requestId)
      .single();
    
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .update({
        status: 'approved',
        verified_by: currentUserId,
        verified_at: new Date().toISOString(),
        notes: notes,
      })
      .eq('id', request.attendance_record_id);
    
    if (attendanceError) throw attendanceError;
    
    // 3. Send WhatsApp notification to employee
    await sendWhatsAppNotification(
      employee.phone,
      `✅ تم تأكيد حضورك!\n\nتم الموافقة على حضورك من قبل المدير.`
    );
    
    toast.success('تم تأكيد الحضور بنجاح');
    
    // Refresh list
    refreshRequests();
    
  } catch (error) {
    console.error('Approve error:', error);
    toast.error('حدث خطأ أثناء التأكيد');
  } finally {
    setIsProcessing(null);
    setAction(null);
  }
};

const rejectRequest = async (requestId: string, notes?: string) => {
  try {
    setIsProcessing(requestId);
    setAction('reject');
    
    // Similar logic but with 'rejected' status
    // Also delete the attendance record
    
    toast.success('تم رفض الحضور');
    refreshRequests();
    
  } catch (error) {
    console.error('Reject error:', error);
    toast.error('حدث خطأ أثناء الرفض');
  } finally {
    setIsProcessing(null);
    setAction(null);
  }
};
```

---

**DUE TO LENGTH LIMIT, I'LL PROVIDE THE REST IN A SECOND FILE.**

This file covers:
✅ Project Overview
✅ Tech Stack
✅ Complete Database Schema
✅ All Employee Pages (Dashboard, Check-in, Attendance, Leave, Custom Request, Profile)
✅ Location Manager Pages (Dashboard, Verifications)

**NEXT FILE WILL INCLUDE**:
- Rest of Location Manager pages (Today Report, Manual Check-in)
- All HR Admin pages (Dashboard, Employees, Locations, Shifts, Leave Management, Reports, Analytics)
- Super Admin pages
- Shared utilities and helpers
- API functions
- Best practices and tips













Hader HR - Complete Development Guide (Part 2)
📋 تعليمات للمطور (Claude Code)
هذا الملف يحتوي على التوجيهات والمواصفات الوظيفية فقط. استخدمها لبناء الأكواد الفعلية.

🏢 HR Admin Routes (/hr/*) - المواصفات الكاملة
1. HR Dashboard (/hr/dashboard)
الغرض:
لوحة تحكم شاملة لمسؤول الموارد البشرية تعرض:

إحصائيات الحضور اليوم على مستوى الشركة
رسوم بيانية لمعدلات الحضور
التنبيهات الهامة
الطلبات المعلقة (إجازات + طلبات خاصة)
النشاط الأخير
إجراءات سريعة

البيانات المطلوبة:

إجمالي الموظفين النشطين
عدد الحاضرين/المتأخرين/الغائبين/في إجازة اليوم
نسبة الحضور
عدد الطلبات المعلقة (إجازات + طلبات خاصة)
بيانات الرسم البياني (معدل الحضور آخر 7/30/90 يوم)
معدل الحضور لكل فرع
آخر 10 أنشطة

المكونات الرئيسية:

Header: ترحيب بالمستخدم + التاريخ الحالي
Metrics Cards: 5-6 بطاقات للمقاييس الرئيسية
Line Chart: رسم بياني لمعدل الحضور (يمكن التبديل بين 7/30/90 يوم)
Bar Chart: مقارنة الحضور بين الفروع
Alerts Section: تنبيهات ملونة للطلبات المعلقة والمشاكل
Quick Actions Grid: 4 أزرار كبيرة (إضافة موظف، إدارة ورديات، تقارير، إعدادات)
Recent Activity List: آخر 10 أنشطة بأيقونات مناسبة

التفاعلات:

عند الضغط على "طلبات إجازات" → انتقل إلى /hr/leaves
عند الضغط على "طلبات خاصة" → انتقل إلى /hr/custom-requests
زر Refresh في Header لتحديث البيانات
تغيير فترة الرسم البياني يُعيد تحميل البيانات

قواعد العمل:

احسب نسبة الحضور = (الحاضرين ÷ إجمالي الموظفين) × 100
اعرض تنبيه "زيادة في الغياب" إذا كان الغياب أكثر من المعدل بـ 20%
حمّل البيانات تلقائياً عند فتح الصفحة


2. Employees Management (/hr/employees)
الغرض:
صفحة إدارة شاملة لكل الموظفين مع إمكانية:

عرض جميع الموظفين في جدول
البحث والتصفية
إضافة/تعديل/تعطيل موظف
استيراد موظفين من Excel
عرض تفاصيل موظف محدد

البيانات المطلوبة:

قائمة كل الموظفين مع (الصورة، الاسم، الرقم الوظيفي، البريد، الجوال، الموقع، القسم، الوردية، الحالة)
قائمة الفروع (للتصفية)
قائمة المواقع (للتصفية)
قائمة الورديات (للتصفية)

المكونات الرئيسية:

Header: العنوان + زر "إضافة موظف" + زر "استيراد Excel"
Stats Bar: 3 إحصائيات (إجمالي - نشط - معطل)
Filters Bar:

حقل بحث (يبحث في الاسم، الرقم، البريد)
فلتر الفرع
فلتر الموقع
فلتر الوردية
فلتر الحالة (نشط/معطل)


Table: جدول بالأعمدة التالية:

الرقم الوظيفي
الموظف (صورة + اسم + بريد)
الموقع
القسم
الوردية
رقم الجوال
الحالة (Badge ملون)
الإجراءات (قائمة منسدلة)


Pagination: في الأسفل

التفاعلات:

البحث يعمل مباشرة (live search) بعد 300ms من توقف الكتابة
التصفية تعمل فوراً عند تغيير القيمة
الجدول قابل للترتيب حسب الاسم والرقم الوظيفي
قائمة الإجراءات لكل موظف تحتوي على:

عرض التفاصيل
تعديل
سجل الحضور
إعادة تعيين كلمة المرور
تفعيل/تعطيل



قواعد العمل:

الموظف المعطل لا يمكنه تسجيل الدخول
عند تعطيل موظف، اسأل عن تأكيد
عند إعادة تعيين كلمة المرور، أرسل الكلمة الجديدة عبر WhatsApp
الصفحة تعرض 20 موظف، مع pagination


3. Add/Edit Employee (/hr/employees/add & /hr/employees/:id/edit)
الغرض:
نموذج شامل لإضافة أو تعديل بيانات موظف
الأقسام المطلوبة:
قسم 1: البيانات الشخصية

صورة الموظف (uploadable)
الاسم الكامل (مطلوب)
الرقم الوظيفي (مطلوب - يجب أن يكون فريد)
رقم الجوال (مطلوب - يجب أن يكون فريد)
البريد الإلكتروني (مطلوب - يجب أن يكون فريد)

قسم 2: بيانات العمل

الفرع (مطلوب - قائمة منسدلة)
الموقع (مطلوب - يتم تحميلها بناءً على الفرع)
القسم (اختياري)
المسمى الوظيفي (اختياري)
تاريخ التعيين (مطلوب)
الوردية (مطلوب - يتم تحميلها بناءً على الموقع)

قسم 3: أرصدة الإجازات

رصيد الإجازات السنوية (مطلوب - رقم - افتراضي: 21)
رصيد الإجازات المرضية (مطلوب - رقم - افتراضي: 10)

قسم 4: بيانات الحساب (فقط في وضع الإضافة)

اسم المستخدم (مطلوب - يجب أن يكون فريد)
كلمة المرور (مطلوب - 8 أحرف على الأقل)
ملاحظة: "سيتم إرسال بيانات الدخول عبر WhatsApp"

قسم 5: الحالة

حساب نشط (تبديل Switch - افتراضي: مفعّل)

التحققات المطلوبة:

الاسم الكامل: لا يقل عن 3 أحرف
الرقم الوظيفي: فريد - لم يُستخدم من قبل
رقم الجوال: صيغة سعودية (+966 أو 05) - فريد
البريد: صيغة بريد صحيحة - فريد
اسم المستخدم: لا يقل عن 3 أحرف - فريد - حروف وأرقام فقط
كلمة المرور: 8 أحرف على الأقل - تحتوي على حرف كبير ورقم

السلوك:

عند اختيار فرع → حمّل المواقع التابعة له
عند اختيار موقع → حمّل الورديات الخاصة به
في وضع التعديل → لا تعرض قسم "بيانات الحساب"
عند الحفظ بنجاح:

في وضع الإضافة: أنشئ حساب في Supabase Auth + أرسل بيانات الدخول عبر WhatsApp
في وضع التعديل: حدّث البيانات فقط
اعرض رسالة نجاح
عُد إلى صفحة قائمة الموظفين




4. Locations Management (/hr/locations)
الغرض:
إدارة جميع مواقع العمل في الشركة
البيانات المطلوبة:

قائمة كل المواقع مع (الاسم، الفرع، العنوان، الإحداثيات، نطاق GPS، عدد الموظفين، عدد الورديات، الحالة)
قائمة الفروع (للتبويب)

المكونات الرئيسية:

Header: العنوان + زر "إضافة موقع"
Branch Tabs: تبويبات لكل فرع + تبويب "كل الفروع"
Locations Grid: بطاقات للمواقع (3 أعمدة في الشاشات الكبيرة)

محتوى بطاقة الموقع:

أيقونة الموقع
اسم الموقع
Badge للفرع
Badge للحالة (نشط/معطل)
العنوان
الإحداثيات (lat, lng)
نطاق GPS
عدد الموظفين
عدد الورديات
زر "عرض الخريطة"
زر "تعديل"
قائمة إجراءات (إدارة الورديات، الموظفين، الإعدادات، تفعيل/تعطيل)

التفاعلات:

عند اختيار تبويب فرع → أظهر المواقع التابعة له فقط
"عرض الخريطة" → افتح Modal بخريطة تفاعلية تُظهر موقع الموقع + دائرة نطاق GPS
"تعديل" → انتقل إلى صفحة التعديل
"إدارة الورديات" → انتقل إلى صفحة الورديات الخاصة بهذا الموقع
"تفعيل/تعطيل" → اسأل عن تأكيد ثم غيّر الحالة

قواعد العمل:

الموقع المعطل لا يظهر للموظفين ولا يمكن التسجيل فيه
عند تعطيل موقع، اسأل: "هناك X موظف في هذا الموقع. هل أنت متأكد؟"


5. Add/Edit Location (/hr/locations/add & /hr/locations/:id/edit)
الغرض:
نموذج لإضافة أو تعديل موقع عمل
الأقسام المطلوبة:
قسم 1: المعلومات الأساسية

اسم الموقع (مطلوب)
الفرع (مطلوب - قائمة منسدلة)
العنوان (اختياري)

قسم 2: موقع GPS

خريطة تفاعلية لاختيار الموقع
حقل Latitude (يتم تعبئته تلقائياً من الخريطة)
حقل Longitude (يتم تعبئته تلقائياً من الخريطة)
نطاق GPS (بالأمتار - مطلوب - افتراضي: 100م)
معاينة الدائرة على الخريطة

قسم 3: إعدادات الحضور

طرق الحضور المفعّلة:

QR Code (تبديل + وقت التجديد بالثواني)
Color Matching (تبديل + وقت التجديد + اختيار الألوان المستخدمة)
Numeric Code (تبديل + وقت التجديد + عدد الأرقام: 4 أو 6)


الأولوية (ترتيب الطرق في قائمة الموظف)

قسم 4: التحقق

GPS:

مطلوب (تبديل - افتراضي: نعم)
نطاق التسامح (افتراضي: 100م)


Selfie:

الوضع (دائماً / عند الشك / معطل)
Face Recognition (تبديل)
Liveness Detection (تبديل)



قسم 5: إعدادات الشك

تفعيل نظام الشك (تبديل - افتراضي: مفعّل)
نقاط الشك:

خارج نطاق GPS: X نقطة (افتراضي: 40)
وقت غير معتاد: X نقطة (افتراضي: 15)
نمط مختلف: X نقطة (افتراضي: 10)
سجل سابق مشبوه: X نقطة (افتراضي: 20)


عتبة الشك (إذا تجاوزها يحتاج موافقة - افتراضي: 50)
مهلة التحقق بالدقائق (افتراضي: 20)

قسم 6: الحالة

موقع نشط (تبديل - افتراضي: مفعّل)

السلوك:

الخريطة تستخدم Leaflet أو Google Maps
عند النقر على الخريطة → حدّث الإحداثيات + ارسم الدائرة
عند تغيير نطاق GPS → حدّث حجم الدائرة على الخريطة
زر "استخدام موقعي الحالي" لتحديد الموقع تلقائياً
احفظ كل الإعدادات في حقل JSONB باسم settings


6. Shifts Management (/hr/shifts)
الغرض:
إدارة ورديات العمل لكل موقع
البيانات المطلوبة:

قائمة الورديات مع (الاسم، الموقع، وقت البدء، وقت النهاية، أيام العمل، المرونات، عدد الموظفين)
قائمة المواقع (للتصفية)

المكونات الرئيسية:

Header: العنوان + زر "إضافة وردية"
Filters: فلتر الموقع
Shifts Grid: بطاقات الورديات

محتوى بطاقة الوردية:

اسم الوردية
اسم الموقع
أوقات العمل (8:00 صباحاً - 5:00 مساءً)
أيام العمل (أحد - خميس)
مدة الاستراحة
عدد الموظفين المُسندين
Badge للحالة (نشط/معطل)
زر "تعديل"
زر "نسخ" (لإنشاء وردية مشابهة)
قائمة إجراءات (عرض الموظفين، تفعيل/تعطيل، حذف)

التفاعلات:

"إضافة وردية" → افتح Modal أو انتقل لصفحة جديدة
"تعديل" → افتح Modal أو انتقل لصفحة التعديل
"نسخ" → افتح Modal مع نفس البيانات + اسم جديد
"حذف" → اسأل عن تأكيد (إذا كان هناك موظفين → امنع الحذف)

قواعد العمل:

لا يمكن حذف وردية بها موظفين (اعرض رسالة خطأ)
الوردية المعطلة لا يمكن إسنادها لموظفين جدد


7. Add/Edit Shift (Modal أو صفحة منفصلة)
الأقسام المطلوبة:
قسم 1: المعلومات الأساسية

اسم الوردية (مطلوب - مثال: "الصباحية")
الموقع (مطلوب - قائمة منسدلة)

قسم 2: أوقات العمل

وقت البدء (مطلوب - Time Picker)
وقت النهاية (مطلوب - Time Picker)
وقت الاستراحة (اختياري - Time Picker)
مدة الاستراحة بالدقائق (اختياري - رقم)
احسب ساعات العمل تلقائياً

قسم 3: أيام العمل

Checkboxes لأيام الأسبوع (السبت - الجمعة)
افتراضي: الأحد - الخميس

قسم 4: مرونات الوقت

التأخر المسموح عند الحضور (بالدقائق - افتراضي: 15)
الحضور المبكر المسموح (بالدقائق - افتراضي: 15)
الانصراف المبكر المسموح (بالدقائق - افتراضي: 15)
التأخر المسموح عند الانصراف (بالدقائق - افتراضي: 15)

قسم 5: الحالة

وردية نشطة (تبديل)

السلوك:

احسب ساعات العمل = (وقت النهاية - وقت البدء - مدة الاستراحة)
اعرض ساعات العمل المحسوبة بوضوح
إذا كان وقت النهاية أقل من وقت البدء → اعتبرها وردية تمتد لليوم التالي


8. Leave Requests Management (/hr/leaves)
الغرض:
مراجعة والموافقة/رفض طلبات الإجازات
البيانات المطلوبة:

قائمة طلبات الإجازات مع (الموظف، النوع، التاريخ، عدد الأيام، السبب، الحالة)

المكونات الرئيسية:

Header: العنوان + إحصائيات (المعلقة، المقبولة، المرفوضة)
Filters:

حالة الطلب (الكل، معلق، مقبول، مرفوض، ملغي)
نوع الإجازة
البحث بالموظف


Requests List: قائمة الطلبات

محتوى بطاقة الطلب:

صورة واسم الموظف + رقمه الوظيفي
نوع الإجازة (Badge ملون)
فترة الإجازة (من - إلى)
عدد الأيام
السبب
رصيد الموظف الحالي من هذا النوع
Badge الحالة
تاريخ الطلب
إذا كانت معلقة:

حقل "ملاحظات" اختياري
زر "قبول"
زر "رفض"



التفاعلات:

عند "قبول":

اسأل عن تأكيد
اخصم الأيام من رصيد الموظف
حدّث حالة الطلب
أرسل إشعار WhatsApp للموظف


عند "رفض":

اطلب سبب الرفض (مطلوب)
حدّث حالة الطلب
أرسل إشعار WhatsApp للموظف مع السبب



قواعد العمل:

إذا لم يكن لدى الموظف رصيد كافٍ → اعرض تحذير قبل القبول
إذا كانت الإجازة تتعارض مع إجازة مقبولة أخرى → امنع القبول
رتّب الطلبات بالأقدم أولاً


9. Custom Requests Management (/hr/custom-requests)
الغرض:
مراجعة والرد على الطلبات الخاصة (شهادات، استفسارات، إلخ)
البيانات المطلوبة:

قائمة الطلبات الخاصة مع (الموظف، العنوان، الوصف، المرفق، الحالة، التاريخ)

المكونات الرئيسية:

Header: العنوان + إحصائيات (المعلقة، المقبولة، المرفوضة)
Filters:

حالة الطلب (الكل، معلق، مقبول، مرفوض)
البحث بالموظف أو العنوان


Requests List: قائمة الطلبات

محتوى بطاقة الطلب:

صورة واسم الموظف + رقمه الوظيفي
عنوان الطلب
الوصف (قابل للتوسيع إذا كان طويل)
مرفق (إن وُجد - صورة أو ملف)
Badge الحالة
تاريخ الطلب
إذا كانت معلقة:

حقل "رد الإدارة" (textarea - مطلوب)
زر "قبول"
زر "رفض"


إذا كانت مقبولة أو مرفوضة:

عرض رد الإدارة
اسم المراجع + التاريخ



التفاعلات:

عند "قبول":

تحقق من وجود رد
حدّث حالة الطلب
أرسل إشعار WhatsApp للموظف مع الرد


عند "رفض":

تحقق من وجود رد (مطلوب)
حدّث حالة الطلب
أرسل إشعار WhatsApp للموظف مع السبب



قواعد العمل:

الرد مطلوب دائماً (قبول أو رفض)
رتّب الطلبات بالأقدم أولاً


10. Reports Page (/hr/reports)
الغرض:
توليد وتصدير تقارير مختلفة
أنواع التقارير المتاحة:
1. تقرير الحضور اليومي

اختر التاريخ
اختر الفرع/الموقع (اختياري)
يعرض: كل الموظفين مع حالة الحضور

2. تقرير الحضور الشهري

اختر الشهر والسنة
اختر الفرع/الموقع (اختياري)
يعرض: لكل موظف (أيام الحضور، التأخير، الغياب، الإجازات، ساعات العمل، الإضافي)

3. تقرير الإجازات

اختر الفترة (من - إلى)
اختر نوع الإجازة (اختياري)
يعرض: كل طلبات الإجازات مع حالاتها

4. تقرير المتأخرين

اختر الفترة (من - إلى)
اختر الموقع (اختياري)
يعرض: الموظفين الأكثر تأخيراً مع عدد مرات التأخير

5. تقرير الغياب

اختر الفترة (من - إلى)
اختر الموقع (اختياري)
يعرض: الموظفين الغائبين مع عدد أيام الغياب

المكونات:

Report Type Selector: بطاقات كبيرة لكل نوع تقرير
Filters Form: نموذج للفلاتر حسب نوع التقرير
Preview Button: زر "معاينة التقرير"
Results Table: جدول النتائج
Export Buttons: تصدير (Excel، PDF، CSV)

السلوك:

عند اختيار نوع تقرير → أظهر الفلاتر المناسبة
عند "معاينة" → اعرض النتائج في جدول
عند "تصدير" → ولّد الملف وحمّله


11. Analytics Dashboard (/hr/analytics)
الغرض:
رؤى تحليلية متقدمة عن بيانات الحضور
الأقسام:
1. ملخص الأداء

نسبة الحضور المتوسطة (30 يوم)
معدل التأخير
معدل الغياب
معدل ساعات العمل
مقارنة مع الشهر السابق

2. رسوم بيانية

Line Chart: اتجاهات الحضور (6 أشهر)
Pie Chart: توزيع أنواع الإجازات
Bar Chart: أكثر 10 موظفين حضوراً
Bar Chart: أكثر 10 موظفين تأخيراً
Heatmap: أيام الأسبوع الأكثر غياباً

3. Insights (رؤى ذكية)

أفضل يوم حضور في الأسبوع
أسوأ يوم حضور
الوردية الأكثر التزاماً
الموقع الأفضل أداءً
تنبيهات (مثل: "الغياب ارتفع 15% هذا الشهر")

التفاعلات:

يمكن تغيير الفترة الزمنية (شهر، 3 أشهر، 6 أشهر، سنة)
يمكن فلترة البيانات حسب الفرع أو الموقع
الرسوم تفاعلية (Recharts)


👑 Super Admin Routes (/admin/*)
1. Super Admin Dashboard (/admin/dashboard)
الغرض:
لوحة تحكم للمدير العام تعرض كل الشركات + إحصائيات عامة
البيانات المطلوبة:

عدد الشركات النشطة
إجمالي الموظفين في كل الشركات
إجمالي المواقع
نسبة الحضور على مستوى النظام
قائمة الشركات مع إحصائياتها

المكونات:

Metrics Cards: إحصائيات عامة
Companies List: جدول/بطاقات للشركات
System Health: حالة السيرفر والخدمات
Recent Activity: آخر الأنشطة على مستوى النظام

التفاعلات:

عرض/تعديل بيانات شركة
تفعيل/تعطيل شركة
عرض تقارير شركة معينة


2. Companies Management (/admin/companies)
الغرض:
إدارة كل الشركات في النظام
المكونات:

قائمة الشركات
إضافة شركة جديدة
تعديل بيانات شركة
إعدادات شركة (Attendance methods، Suspicion، إلخ)

بيانات الشركة:

الاسم
الشعار
عدد الفروع
عدد المواقع
عدد الموظفين
الإعدادات الافتراضية
الحالة (نشط/معطل)


3. System Settings (/admin/settings)
الغرض:
إعدادات عامة للنظام
الأقسام:

إعدادات WhatsApp API
إعدادات Supabase Storage
إعدادات الأمان
Backup والاستعادة
Logs النظام


🛠️ Shared Utilities & Helpers
1. Date & Time Helpers
ملفات مطلوبة:

src/utils/dateHelpers.ts

الوظائف المطلوبة:

formatDate(date): تنسيق التاريخ بالعربي (15 أكتوبر 2025)
formatTime(date): تنسيق الوقت (8:15 صباحاً)
formatDateTime(date): تنسيق التاريخ والوقت معاً
formatRelativeTime(date): وقت نسبي (منذ 5 دقائق، قبل ساعتين)
calculateWorkHours(start, end, breakMinutes): حساب ساعات العمل
isLate(checkIn, expectedTime, bufferMinutes): هل الموظف متأخر؟
calculateDaysBetween(start, end): حساب عدد الأيام
getWorkingDays(start, end, workDays): حساب أيام العمل (باستثناء الجمع والعطل)


2. GPS & Location Helpers
ملفات مطلوبة:

src/utils/gpsHelpers.ts

الوظائف المطلوبة:

getCurrentPosition(): الحصول على موقع GPS الحالي
calculateDistance(lat1, lng1, lat2, lng2): حساب المسافة بين نقطتين (بالأمتار)
isWithinRadius(position, center, radius): هل الموقع داخل النطاق؟
formatCoordinates(lat, lng): تنسيق الإحداثيات


3. Suspicion Score Calculator
ملفات مطلوبة:

src/utils/suspicionCalculator.ts

الوظيفة الرئيسية:
calculateSuspicionScore(params) {
  // params = {
  //   gpsDistance,
  //   gpsRequired,
  //   gpsRadius,
  //   checkInTime,
  //   expectedTime,
  //   employeeHistory,
  //   settings
  // }
  
  // احسب النقاط بناءً على:
  // 1. المسافة من الموقع
  // 2. الوقت (مبكر جداً أو متأخر جداً)
  // 3. نمط مختلف عن العادة
  // 4. سجل سابق مشبوه
  
  // أرجع: { score, reasons: [{ type, text, points }] }
}
```

---

### 4. WhatsApp Integration

**ملفات مطلوبة:**
- `src/services/whatsappService.ts`

**الوظائف المطلوبة:**
- `sendWhatsAppMessage(phone, message, type)`: إرسال رسالة
- `sendVerificationCode(phone, code)`: إرسال كود التحقق
- `sendAttendanceConfirmation(user, record)`: إرسال تأكيد حضور
- `sendLeaveApproval(user, leave)`: إرسال موافقة إجازة
- `sendLeaveRejection(user, leave, reason)`: إرسال رفض إجازة

**ملاحظة:** يجب استخدام WhatsApp Business API أو خدمة مثل Twilio/MessageBird

---

### 5. File Upload Helpers

**ملفات مطلوبة:**
- `src/utils/uploadHelpers.ts`

**الوظائف المطلوبة:**
- `uploadAvatar(file, userId)`: رفع صورة الموظف
- `uploadSelfie(file, recordId)`: رفع صورة السيلفي
- `uploadAttachment(file, requestId)`: رفع مرفق
- `deleteFile(path)`: حذف ملف
- `getPublicUrl(path)`: الحصول على رابط عام

**ملاحظة:** استخدم Supabase Storage

---

### 6. Export Helpers

**ملفات مطلوبة:**
- `src/utils/exportHelpers.ts`

**الوظائف المطلوبة:**
- `exportToExcel(data, filename)`: تصدير إلى Excel
- `exportToPDF(data, filename)`: تصدير إلى PDF
- `exportToCSV(data, filename)`: تصدير إلى CSV

**المكتبات المقترحة:**
- Excel: `xlsx`
- PDF: `jspdf` + `jspdf-autotable`

---

### 7. Validation Schemas (Zod)

**ملفات مطلوبة:**
- `src/schemas/authSchemas.ts`
- `src/schemas/employeeSchemas.ts`
- `src/schemas/attendanceSchemas.ts`
- `src/schemas/leaveSchemas.ts`

**مثال:**
```
// employeeSchema
{
  fullName: string().min(3),
  employeeNumber: string().min(3),
  email: string().email(),
  phone: string().regex(/^(05|\+9665)\d{8}$/),
  branchId: string().uuid(),
  locationId: string().uuid(),
  shiftId: string().uuid(),
  vacationBalance: number().min(0).default(21),
  sickLeaveBalance: number().min(0).default(10),
  ...
}
```

---

### 8. Permission Checks

**ملفات مطلوبة:**
- `src/utils/permissions.ts`

**الوظائف المطلوبة:**
- `canViewEmployees(user)`: هل يمكن للمستخدم عرض الموظفين؟
- `canEditEmployee(user, employeeId)`: هل يمكن تعديل موظف؟
- `canApproveLeave(user)`: هل يمكن الموافقة على إجازات؟
- `canAccessLocation(user, locationId)`: هل يمكن الوصول لموقع؟

**القواعد:**
- Super Admin: كل الصلاحيات
- HR Admin: كل شيء في شركته
- Location Manager: فقط مواقعه المُسندة
- Employee: بياناته فقط

---

## 🎨 Design System Guidelines

### Colors
- Primary: `#FBBF24` (أصفر ذهبي)
- Success: `#10B981`
- Error: `#EF4444`
- Warning: `#F59E0B`
- Info: `#3B82F6`

### Typography
- Arabic: 'IBM Plex Sans Arabic'
- English/Numbers: 'Inter'
- استخدم font-size من Tailwind (text-sm, text-base, text-lg, إلخ)

### Spacing
- استخدم spacing scale من Tailwind (p-4, m-6, gap-4, إلخ)

### Border Radius
- Cards: `rounded-xl` (12px)
- Buttons: `rounded-lg` (8px)
- Inputs: `rounded-lg` (8px)

### Shadows
- Cards: `shadow-lg`
- Elevated Cards: `shadow-xl`
- Hover: `hover:shadow-2xl`

### Animations
- استخدم Tailwind transitions
- Duration: 200-300ms
- Easing: ease-in-out

---

## 🔐 Authentication Flow

### Login Process:
1. المستخدم يدخل username + password
2. ابحث عن user بهذا الusername في جدول `users`
3. استخدم Supabase Auth للتحقق من password (signInWithPassword باستخدام email)
4. إذا نجح → حدّث `last_login_at`
5. وجّه حسب الدور:
   - employee → `/employee/dashboard`
   - loc_manager → `/manager/dashboard`
   - hr_admin → `/hr/dashboard`
   - super_admin → `/admin/dashboard`

### Password Reset Flow:
1. المستخدم يدخل username أو phone
2. اختر طريقة (WhatsApp أو Email)
3. ولّد code من 6 أرقام
4. احفظه في جدول `verification_codes` مع expiry (5 دقائق)
5. أرسله عبر الطريقة المختارة
6. المستخدم يدخل الcode
7. تحقق من الcode وأنه لم ينتهي
8. اسمح للمستخدم بإدخال كلمة سر جديدة
9. حدّث كلمة السر في Supabase Auth

---

## 📊 Data Fetching Strategy

### استخدم Supabase Client:
```
// في كل صفحة
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  const { data, error } = await supabase
    .from('table_name')
    .select('*, related_table(*)')
    .eq('company_id', currentCompanyId)
    .order('created_at', { ascending: false });
  
  if (error) {
    toast.error('حدث خطأ في تحميل البيانات');
    return;
  }
  
  setData(data);
};
```

### استخدم React Query (اختياري) لـ:
- Caching
- Auto-refetch
- Loading states
- Error handling

---

## 🚀 Performance Best Practices

1. **Lazy Loading**: استخدم React.lazy() للصفحات
2. **Pagination**: لا تحمّل أكثر من 50 سجل في المرة
3. **Indexes**: تأكد من وجود indexes على الأعمدة المُستخدمة في WHERE/JOIN
4. **Images**: استخدم أحجام مناسبة (avatars: 200x200)
5. **Debouncing**: للبحث المباشر (300ms)
6. **Memoization**: استخدم useMemo و useCallback للعمليات الثقيلة

---

## 🔒 Security Rules

1. **RLS Policies**: فعّل Row Level Security على كل الجداول
2. **API Keys**: لا تكشف Supabase keys في Frontend (استخدم anon key فقط)
3. **File Uploads**: تحقق من نوع وحجم الملف
4. **SQL Injection**: استخدم Parameterized queries دائماً
5. **XSS Protection**: لا تستخدم dangerouslySetInnerHTML
6. **CORS**: حدد الdomains المسموحة في Supabase

---

## 📱 Mobile Responsiveness

### Breakpoints (استخدم Tailwind):
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile-First:
- ابدأ بتصميم Mobile ثم وسّع
- استخدم `sm:`, `md:`, `lg:` للتحسينات
- Sidebar يصبح Bottom Navigation في Mobile
- جداول تتحول إلى Cards في Mobile
- Modals تصبح Full-screen في Mobile

---

## 🧪 Testing Guidelines

### Unit Tests:
- اختبر الـ utility functions
- اختبر الـ validation schemas
- اختبر الـ calculations (suspicion score, work hours)

### Integration Tests:
- اختبر الـ authentication flow
- اختبر الـ CRUD operations
- اختبر الـ form submissions

### E2E Tests (اختياري):
- اختبر الـ critical user flows
- استخدم Playwright أو Cypress

---

## 📝 Code Style Guidelines

1. **Naming Conventions**:
   - Components: PascalCase (EmployeeCard.tsx)
   - Functions: camelCase (calculateWorkHours)
   - Constants: UPPER_SNAKE_CASE (MAX_FILE_SIZE)
   - Files: kebab-case (employee-form.tsx) أو PascalCase

2. **File Structure**:
```
src/
├── components/
│   ├── common/          (Button, Input, Card)
│   ├── employee/        (EmployeeCard, CheckInForm)
│   ├── layout/          (Sidebar, Header)
│   └── ...
├── pages/
│   ├── employee/
│   ├── manager/
│   ├── hr/
│   └── admin/
├── utils/
├── services/
├── hooks/
├── contexts/
├── schemas/
└── types/

TypeScript:

استخدم types بدلاً من any
استخدم interfaces للكائنات
استخدم enums للقيم الثابتة


Comments:

اكتب تعليقات بالعربي لشرح Business Logic
اكتب تعليقات بالإنجليزي للكود التقني




✅ Final Checklist قبل التسليم

 كل الصفحات المطلوبة تم بناؤها
 كل الـ CRUD operations تعمل
 Authentication & Authorization يعمل بشكل صحيح
 RLS Policies مُفعّلة ومضبوطة
 Validation على كل النماذج
 Error handling في كل العمليات
 Loading states لكل العمليات
 Toast notifications للنجاح/الفشل
 Mobile responsive (اختبر على جهاز حقيقي)
 RTL support يعمل بشكل صحيح
 WhatsApp integration يعمل
 File uploads تعمل
 Reports & Analytics تعمل
 Performance optimization (lazy loading, pagination)
 Security checks (no exposed keys, RLS working)
 Code cleanup (no console.logs, unused imports)


🎯 ملاحظات نهائية للمطور

ابدأ بالـ Database: أنشئ كل الجداول والعلاقات أولاً
ثم Authentication: بناء نظام تسجيل الدخول
ثم الـ Layouts: بناء الـ Sidebar والHeader
ثم الصفحات بالترتيب: Employee → Manager → HR → Admin
اختبر باستمرار: اختبر كل feature قبل الانتقال للتالي
استخدم Git: commit بعد كل feature
اسأل إذا كان هناك غموض: لا تخمّن، اسأل!
