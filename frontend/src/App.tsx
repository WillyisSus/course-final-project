import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import '@/index.css'
import NotFoundPage from './pages/NotFoundPage'
import MainLayout from './layouts/MainLayout'
import VerifyOtpPage from './pages/VerifyOTPPage'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailsPage'
import { Toaster } from './components/ui/sonner'
import PersonalProfilePage from './pages/PersonalProfilePage'
import UploadProductPage from './pages/UploadProductPage'
import UserProfileTab from './components/UserProfileTab'
import SellerInfoTab from './components/SellerInfoTab'
import AutoBidHistoryTab from './components/AutoBidHistoryTab'
import ForbiddenPage from './pages/ForbiddenPage'
import CheckoutPage from './pages/CheckoutPage'
import BlockedBidderTab from './components/BlockedBidderTab'
import BlockedByProductTab from './components/BlockedByProductTab'
const router = createBrowserRouter([
  {
    path:"",
    element: <MainLayout/>,
    children:[
       {
        index: true,
        Component: HomePage
      },{
        path: "products",
        Component: ProductListPage
      }, {
        path: "products/:id",
        Component: ProductDetailPage
      }, {
        path: "profile",
        element: <PersonalProfilePage/>,
        children: [
          {
            index:true,
            Component: UserProfileTab
          },
          {
            path: "autobids",
            Component: AutoBidHistoryTab
          },
          {
            path: "seller",
            Component: SellerInfoTab
          }, {
            path: "blocked-products",
            Component: BlockedByProductTab
          }, {
            path: "blocked-bidders",
            Component: BlockedBidderTab
          }
        ]
      }, {
        path: "upload",
        Component: UploadProductPage
      }

    ]
  },
  {
    path: "login",
    Component: LoginPage
  },{
    path: "register",
    Component: RegisterPage
  },{
    path: "verify-otp",
    Component: VerifyOtpPage
  },{
    path: "*",
    Component: NotFoundPage
  }, {
    path: "forbidden",
    Component: ForbiddenPage
  }, {
    path: "checkout/:productId",
    Component: CheckoutPage
  }

])
function App() {
  
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position='top-center'/>
    </>
  )
}
export default App
