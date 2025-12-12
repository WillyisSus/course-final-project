import {NavigationMenu, 
    NavigationMenuContent, 
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Input } from "@/components/ui/input"
import { Link } from "react-router"

function NavBar() {
  return (
    <div className="w-full p-1 flex items-center justify-between border-b border-accent">
        <NavigationMenu id="nav-bar">
            <NavigationMenuList className="flex-wrap">
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Categrories</NavigationMenuTrigger>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link to={"/"}>Your Profile</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link to={"/ToDo"}>WL's ToDo</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
        
    </div>
    
  )
}

export default NavBar