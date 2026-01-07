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
        Component: PersonalProfilePage
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
