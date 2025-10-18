import React from "react";

interface UserLocationDisplayProps {
  companyName?: string | null;
  branchName?: string | null;
  locationName?: string | null;
  locationsCount?: number;
  variant?: "inline" | "card";
  className?: string;
}

/**
 * Component to display user's company, branch, and location information
 * Supports inline format and handles missing data gracefully
 */
export const UserLocationDisplay: React.FC<UserLocationDisplayProps> = ({
  companyName,
  branchName,
  locationName,
  locationsCount,
  variant = "inline",
  className = "",
}) => {
  const defaultText = "غير محدد";

  // Build the display string
  const buildInlineDisplay = (): string => {
    const parts: string[] = [];

    // Add company
    if (companyName) {
      parts.push(companyName);
    } else {
      parts.push(defaultText);
    }

    // Add branch
    if (branchName) {
      parts.push(branchName);
    } else {
      parts.push(defaultText);
    }

    // Add location or locations count
    if (locationsCount && locationsCount > 1) {
      parts.push(`يدير ${locationsCount} مواقع`);
    } else if (locationName) {
      parts.push(locationName);
    } else {
      parts.push(defaultText);
    }

    return parts.join(" / ");
  };

  if (variant === "inline") {
    return (
      <span className={className}>
        {buildInlineDisplay()}
      </span>
    );
  }

  // Card variant for Profile page
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">🏢 الشركة:</span>
        <span className="font-medium">{companyName || defaultText}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">📂 الفرع:</span>
        <span className="font-medium">{branchName || defaultText}</span>
      </div>
      {locationsCount && locationsCount > 1 ? (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">📍 المواقع:</span>
          <span className="font-medium">يدير {locationsCount} مواقع</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">📍 الموقع:</span>
          <span className="font-medium">{locationName || defaultText}</span>
        </div>
      )}
    </div>
  );
};
