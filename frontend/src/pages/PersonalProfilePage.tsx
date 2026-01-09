import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PersonalProfilePage = () => {
  const { user } = useSelector((state: any) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Determine active tab based on the current URL
  // Default to 'profile' if we are at the root '/profile'
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("/autobids")) return "autobids";
    if (path.includes("/seller")) return "seller";
    if (path.includes("/blocked-bidders")) return "blocked-bidders";
    if (path.includes("/blocked-products")) return "blocked-products";
    return "profile";
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  // Sync state with URL changes (e.g. user clicks Back button)
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  // 2. Handle Tab Click -> Navigate instead of just switching content
  const handleTabChange = (value: string) => {
    switch (value) {
      case "profile":
        navigate("/profile");
        break;
      case "autobids":
        navigate("/profile/autobids");
        break;
      case "seller":
        navigate("/profile/seller");
        break;
      case "blocked-bidders":
        navigate("/profile/blocked-bidders");
        break;
      case "blocked-products":
        navigate("/profile/blocked-products");
        break;
      default:
        navigate("/profile");
    }
  };

  if (!user)
    return (
      <div className="p-10 text-center text-muted-foreground">
        Please log in to view your profile.
      </div>
    );
  return (
    <div className="container mx-auto py-10 space-y-8 max-w-5xl">
      {/* PAGE HEADER */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          My Account
        </h1>
        <p className="text-muted-foreground">
          Manage your profile and auction activities
        </p>
      </div>

      {/* We use the Tabs component for the VISUALS (List & Triggers),
               but we remove TabsContent.
               We control the 'value' prop to match the URL.
            */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3 bg-muted/50 p-1">
          <TabsTrigger value="profile">Personal Profile</TabsTrigger>
          <TabsTrigger value="autobids">Auto-Bid History</TabsTrigger>
          <TabsTrigger value="seller">Seller Dashboard</TabsTrigger>
          <TabsTrigger value="blocked-bidders">Blocked Bidders</TabsTrigger>
          <TabsTrigger value="blocked-products">Blocked by</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 3. RENDER CONTENT VIA OUTLET */}
      {/* We pass the 'user' object via context so children can access it without Redux if needed */}
      <div className="animate-in fade-in duration-300">
        <Outlet context={{ user }} />
      </div>
    </div>
  );
};

export default PersonalProfilePage;
