import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      {/* ToastContainer allows you to show notifications anywhere in the app */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      {/* The Outlet renders the current page based on the URL */}
      <Outlet />
    </>
  );
}

export default App;