/**
 * Geolocation Service
 * Handles office location management and distance validation
 */

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface OfficeLocation extends Location {
  radius: number; // in meters
  name?: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a location is within the allowed radius of office location
 */
export function isWithinRadius(
  userLocation: Location,
  officeLocation: OfficeLocation
): { valid: boolean; distance: number } {
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    officeLocation.lat,
    officeLocation.lng
  );

  return {
    valid: distance <= officeLocation.radius,
    distance: Math.round(distance),
  };
}

/**
 * Validate location for attendance
 */
export function validateAttendanceLocation(
  userLocation: Location | null | undefined,
  officeLocation: OfficeLocation | null
): { valid: boolean; error?: string; distance?: number } {
  // If no office location is set, allow attendance from anywhere
  if (!officeLocation) {
    return { valid: true };
  }

  // If user location is not provided, reject
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    return {
      valid: false,
      error: 'Location is required for attendance. Please enable location access.',
    };
  }

  // Check if within radius
  const { valid, distance } = isWithinRadius(userLocation, officeLocation);

  if (!valid) {
    return {
      valid: false,
      error: `You are ${distance}m away from office. You must be within ${officeLocation.radius}m radius to mark attendance.`,
      distance,
    };
  }

  return { valid: true, distance };
}

/**
 * Format location for display
 */
export function formatLocation(location: Location): string {
  if (location.address) {
    return location.address;
  }
  return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
}
