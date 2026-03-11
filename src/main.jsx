import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ViewTrip from './view-trip/[tripId]/index.jsx' // adjust path if different
import CreateTrip from './create-trip' // adjust path if different
import GeneratingTrip from './generating-trip'
import SignInPage from './sign-in' // adjust path if different
import MyTrips from './my-trips' // adjust path if different
import Header from './components/custom/Header' // adjust path if different
import { Toaster } from './components/ui/sonner'
import { GoogleOAuthProvider } from '@react-oauth/google'

function RootLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <App />,
      },
      {
        path: 'create-trip',
        element: <CreateTrip />,
      },
      {
        path: 'generating-trip',
        element: <GeneratingTrip />,
      },
      {
        path: 'sign-in',
        element: <SignInPage />,
      },
      {
        path: 'view-trip/:tripId',
        element: <ViewTrip />,
      },
      {
        path: 'my-trips',
        element: <MyTrips />,
      },
    ],
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}>
    <RouterProvider router={router} />
    <Toaster />
    </GoogleOAuthProvider>
  </StrictMode>,
)