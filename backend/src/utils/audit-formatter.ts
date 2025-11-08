/**
 * Formats audit log actions into human-readable descriptions
 */

interface AuditLog {
  action: string;
  entity?: string;
  entityId?: string;
  meta?: any;
  user?: {
    name: string;
    email: string;
  };
}

export function formatAuditAction(log: AuditLog): string {
  const userName = log.user?.name || 'User';
  const entity = log.entity || 'item';
  const meta = log.meta || {};

  // Map actions to human-readable descriptions
  switch (log.action) {
    // User actions
    case 'USER_CREATE':
      return `${userName} created a new user account${meta.email ? ` for ${meta.email}` : ''}${meta.role ? ` with ${meta.role} role` : ''}`;
    
    case 'USER_UPDATE':
      const updates = [];
      if (meta.role) updates.push(`role to ${meta.role}`);
      if (meta.isActive !== undefined) updates.push(meta.isActive ? 'activated account' : 'deactivated account');
      return `${userName} updated user${updates.length ? ': ' + updates.join(', ') : ''}`;
    
    case 'USER_DELETE':
    case 'DELETE':
      return `${userName} deleted ${entity.toLowerCase()}${meta.soft ? ' (soft delete)' : ''}`;
    
    // Leave actions
    case 'LEAVE_APPLY':
      return `${userName} applied for ${meta.days || 0} day(s) leave`;
    
    case 'LEAVE_APPROVE':
      return `${userName} approved a leave request${meta.days ? ` for ${meta.days} day(s)` : ''}`;
    
    case 'LEAVE_REJECT':
      return `${userName} rejected a leave request${meta.reason ? `: ${meta.reason}` : ''}`;
    
    case 'LEAVE_CANCEL':
      return `${userName} cancelled their leave request`;
    
    // Attendance actions
    case 'ATTENDANCE_CHECKIN':
    case 'CHECK_IN':
      return `${userName} checked in${meta.time ? ` at ${meta.time}` : ''}`;
    
    case 'ATTENDANCE_CHECKOUT':
    case 'CHECK_OUT':
      return `${userName} checked out${meta.time ? ` at ${meta.time}` : ''}`;
    
    case 'ATTENDANCE_MARK':
      return `${userName} marked attendance${meta.status ? ` as ${meta.status}` : ''}`;
    
    // Payroll actions
    case 'PAYROLL_RUN':
      return `${userName} ran payroll${meta.period ? ` for ${meta.period}` : ''}${meta.employeeCount ? ` (${meta.employeeCount} employees)` : ''}`;
    
    case 'PAYROLL_APPROVE':
      return `${userName} approved payroll`;
    
    case 'PAYSLIP_GENERATE':
      return `${userName} generated payslip${meta.month ? ` for ${meta.month}` : ''}`;
    
    // Settings actions
    case 'SETTINGS_UPDATE':
      return `${userName} updated ${meta.category || 'system'} settings`;
    
    // Profile actions
    case 'PROFILE_UPDATE':
      return `${userName} updated their profile`;
    
    case 'PROFILE_PHOTO_UPDATE':
      return `${userName} updated profile photo`;
    
    // Role actions
    case 'ROLE_ASSIGN':
      return `${userName} assigned ${meta.role || 'a role'} to user`;
    
    case 'ROLE_REVOKE':
      return `${userName} revoked ${meta.role || 'a role'} from user`;
    
    // Login/Auth actions
    case 'LOGIN':
    case 'USER_LOGIN':
      return `${userName} logged in${meta.ip ? ` from ${meta.ip}` : ''}`;
    
    case 'LOGOUT':
    case 'USER_LOGOUT':
      return `${userName} logged out`;
    
    case 'PASSWORD_CHANGE':
      return `${userName} changed their password`;
    
    case 'PASSWORD_RESET':
      return `${userName} reset their password`;
    
    // Generic CRUD actions
    case 'CREATE':
      return `${userName} created ${entity.toLowerCase()}`;
    
    case 'UPDATE':
      return `${userName} updated ${entity.toLowerCase()}`;
    
    case 'READ':
    case 'VIEW':
      return `${userName} viewed ${entity.toLowerCase()}`;
    
    // Default fallback
    default:
      // Convert snake_case or UPPER_CASE to readable format
      const readable = log.action
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      
      return `${userName} performed action: ${readable}${entity ? ` on ${entity.toLowerCase()}` : ''}`;
  }
}

/**
 * Formats audit log timestamp to relative time
 */
export function formatAuditTime(date: Date | string): string {
  const now = new Date();
  const logDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - logDate.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  // For older dates, show actual date
  return logDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: logDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
}

/**
 * Get icon/emoji for audit action type
 */
export function getAuditIcon(action: string): string {
  if (action.includes('CREATE')) return '➕';
  if (action.includes('UPDATE')) return '✏️';
  if (action.includes('DELETE')) return '🗑️';
  if (action.includes('LOGIN')) return '🔐';
  if (action.includes('LOGOUT')) return '🚪';
  if (action.includes('APPROVE')) return '✅';
  if (action.includes('REJECT')) return '❌';
  if (action.includes('LEAVE')) return '🏖️';
  if (action.includes('ATTENDANCE') || action.includes('CHECK')) return '⏰';
  if (action.includes('PAYROLL') || action.includes('PAYSLIP')) return '💰';
  if (action.includes('SETTINGS')) return '⚙️';
  if (action.includes('PROFILE')) return '👤';
  return '📝';
}
