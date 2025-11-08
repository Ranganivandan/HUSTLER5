import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Trash2, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { officeLocationApi } from '@/lib/api';

interface OfficeLocation {
  lat: number;
  lng: number;
  address?: string;
  radius: number;
  name?: string;
}

export default function OfficeLocation() {
  const [location, setLocation] = useState<OfficeLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    lat: '',
    lng: '',
    address: '',
    radius: '10',
    name: '',
  });

  const loadLocation = async () => {
    setLoading(true);
    try {
      const data = await officeLocationApi.get();
      if (data) {
        setLocation(data);
        setFormData({
          lat: data.lat.toString(),
          lng: data.lng.toString(),
          address: data.address || '',
          radius: data.radius.toString(),
          name: data.name || '',
        });
      }
    } catch (error) {
      console.error('Failed to load office location:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
        }));

        // Try to get address using reverse geocoding (optional)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data.display_name) {
            setFormData((prev) => ({
              ...prev,
              address: data.display_name,
            }));
          }
        } catch (error) {
          console.error('Failed to get address:', error);
        }

        setGettingLocation(false);
        toast.success('Current location captured!');
      },
      (error) => {
        setGettingLocation(false);
        toast.error('Failed to get location: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSave = async () => {
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    const radius = parseFloat(formData.radius);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error('Invalid latitude. Must be between -90 and 90');
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error('Invalid longitude. Must be between -180 and 180');
      return;
    }

    if (isNaN(radius) || radius < 1 || radius > 10000) {
      toast.error('Invalid radius. Must be between 1 and 10000 meters');
      return;
    }

    setSaving(true);
    try {
      await officeLocationApi.set({
        lat,
        lng,
        address: formData.address || undefined,
        radius,
        name: formData.name || undefined,
      });
      toast.success('Office location saved successfully!');
      await loadLocation();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save office location');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the office location? This will disable geofencing for attendance.')) {
      return;
    }

    setSaving(true);
    try {
      await officeLocationApi.delete();
      toast.success('Office location deleted. Geofencing disabled.');
      setLocation(null);
      setFormData({
        lat: '',
        lng: '',
        address: '',
        radius: '10',
        name: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete office location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Office Location</h1>
          <p className="text-muted-foreground">
            Configure office location for geofencing-based attendance validation
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geofencing Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : location ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Employees must be within {location.radius}m radius to mark attendance
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Radius</p>
                    <p className="font-medium">{location.radius} meters</p>
                  </div>
                  {location.name && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{location.name}</p>
                    </div>
                  )}
                  {location.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{location.address}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Geofencing is disabled. Employees can mark attendance from anywhere.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Configure Office Location</CardTitle>
            <CardDescription>
              Set the office location and radius for attendance validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Get Current Location Button */}
            <div>
              <Button
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="mr-2 h-4 w-4" />
                    Use Current Location
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Click to automatically fill coordinates from your current location
              </p>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">
                  Latitude <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.000001"
                  placeholder="23.022505"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Range: -90 to 90</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lng">
                  Longitude <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.000001"
                  placeholder="72.571365"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Range: -180 to 180</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">
                  Radius (meters) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="radius"
                  type="number"
                  placeholder="10"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 10-50m for small offices (1-10000m allowed)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Office Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="Main Office"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City, Country"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleSave} disabled={saving || !formData.lat || !formData.lng}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Location
                  </>
                )}
              </Button>

              {location && (
                <Button onClick={handleDelete} disabled={saving} variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Location
                </Button>
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                How it works
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Employees must be within the specified radius to mark attendance</li>
                <li>• Location is verified on both check-in and check-out</li>
                <li>• If no office location is set, employees can mark attendance from anywhere</li>
                <li>• Distance is calculated using GPS coordinates (accurate to ~10 meters)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
