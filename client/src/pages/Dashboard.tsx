import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import EditBranchForm from '../components/EditBranchForm'; // <-- Import the new form
import { PencilSquareIcon } from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Branch {
  _id: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
  phoneNumber: string;
  status: 'active' | 'inactive';
}

const Dashboard = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // <-- State for the modal

  const fetchBranchDetails = async () => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${BASE_URL}/api/branches/${branchId}`, { withCredentials: true });
      setBranch(data);
    } catch (error) {
      console.error("Failed to fetch branch details", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchDetails();
  }, [branchId]);

  if (isLoading) {
    return <div>Loading Branch Dashboard...</div>;
  }

  if (!branch) {
    return <div>Could not load branch details.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {branch.branchName} Dashboard
        </h2>
        <button
          onClick={() => setIsEditModalOpen(true)} // <-- Open the modal
          className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <PencilSquareIcon className="h-5 w-5 text-gray-500"/>
          Edit Branch
        </button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">
          Status: 
          <span className={`ml-2 font-bold ${branch.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
            {branch.status.charAt(0).toUpperCase() + branch.status.slice(1)}
          </span>
        </p>
        <p className="text-gray-600 mt-2">Address: {branch.address}, {branch.city}</p>
      </div>

      <div className="mt-8">
        <p>This is where the operational ERP activities for this specific branch will go.</p>
      </div>

      {/* Render the Edit Branch Form Modal */}
      <EditBranchForm 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchBranchDetails} // Refresh data on successful update
        branch={branch} // Pass current branch data to the form
      />
    </div>
  );
};

export default Dashboard;