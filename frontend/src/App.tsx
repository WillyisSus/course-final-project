import './index.css'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router'
import HomePage from '@/pages/HomePage'
import ToDo from '@/pages/ToDo'
const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage
  },{
    path: "/ToDo",
    Component: ToDo,
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
