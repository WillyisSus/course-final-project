import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-gray-200 text-center">
        
        {/* Consistent Header */}
        <CardHeader className="pb-4">
          <CardTitle className="text-4xl font-bold text-blue-600">
            BigBiddie
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8 px-10 pb-10">
            {/* Message */}
            <div className="space-y-2">
                <h1 className="text-6xl font-black text-gray-200">404</h1>
                <h2 className="text-xl font-semibold text-gray-800">
                    Oops! You have reached nowhere.
                </h2>
                <p className="text-sm text-gray-500">
                    The page you are looking for does not exist or has been moved.
                </p>
            </div>

            {/* Action */}
            <Button asChild className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 font-bold">
                <Link to="/">Return to Home</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFoundPage;