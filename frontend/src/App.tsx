import './index.css'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router'
import HomePage from '@/pages/HomePage'

const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage, 
  },
])
function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}
export default App
