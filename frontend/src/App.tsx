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
    </>
  )
}
export default App
