"use client";

import { useAppSettings } from '@/context/AppSettingsContext';
import { Wrench, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MaintenanceMode = () => {
  const { appSettings, loading } = useAppSettings();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-300 rounded mb-6 w-96"></div>
          <div className="h-8 bg-gray-300 rounded mb-4 w-80"></div>
          <div className="h-6 bg-gray-300 rounded w-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center">
            <Wrench className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Store Under Maintenance
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            We're currently performing some maintenance on our store to improve your shopping experience.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Estimated Time</h4>
                <p className="text-sm text-blue-700">
                  We expect to be back online shortly. Please check back in a few minutes.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">What's Happening?</h4>
                <p className="text-sm text-yellow-700">
                  We're updating our systems to provide you with a better shopping experience.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              Try Again
            </Button>
            <p className="text-xs text-gray-500">
              If you continue to see this message, please try again later.
            </p>
          </div>

          {appSettings?.defaultStoreEmail && (
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Need immediate assistance? Contact us at{' '}
                <a 
                  href={`mailto:${appSettings.defaultStoreEmail}`}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  {appSettings.defaultStoreEmail}
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceMode; 