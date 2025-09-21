import { useState, useEffect } from 'react';
import { XMarkIcon, CubeIcon, ExclamationTriangleIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface InventoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InventoryItem {
  _id: string;
  itemName: string;
  category: 'hair_products' | 'skin_care' | 'tools' | 'consumables' | 'cleaning';
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  pricePerUnit: number;
  supplier: string;
  lastRestocked: string;
  expiryDate?: string;
  isLowStock: boolean;
}

const InventoryManagementModal = ({ isOpen, onClose }: InventoryManagementModalProps) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: '',
    category: 'hair_products' as InventoryItem['category'],
    currentStock: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    unit: '',
    pricePerUnit: 0,
    supplier: '',
    expiryDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen]);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchQuery, selectedCategory, showLowStockOnly]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/inventory`, {
        withCredentials: true
      });
      setInventory(response.data.inventory || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      // Mock data for demonstration
      const mockInventory = [
        {
          _id: '1',
          itemName: 'L\'Oreal Hair Color - Blonde',
          category: 'hair_products' as const,
          currentStock: 5,
          minStockLevel: 10,
          maxStockLevel: 50,
          unit: 'tubes',
          pricePerUnit: 450,
          supplier: 'Beauty Supplies Co.',
          lastRestocked: '2025-01-10',
          expiryDate: '2026-01-10',
          isLowStock: true
        },
        {
          _id: '2',
          itemName: 'Professional Hair Scissors',
          category: 'tools' as const,
          currentStock: 8,
          minStockLevel: 5,
          maxStockLevel: 15,
          unit: 'pieces',
          pricePerUnit: 2500,
          supplier: 'Salon Tools Ltd.',
          lastRestocked: '2024-12-15',
          isLowStock: false
        },
        {
          _id: '3',
          itemName: 'Facial Cleanser - Sensitive Skin',
          category: 'skin_care' as const,
          currentStock: 2,
          minStockLevel: 8,
          maxStockLevel: 25,
          unit: 'bottles',
          pricePerUnit: 650,
          supplier: 'Skincare Solutions',
          lastRestocked: '2025-01-05',
          expiryDate: '2025-12-31',
          isLowStock: true
        },
        {
          _id: '4',
          itemName: 'Disposable Towels',
          category: 'consumables' as const,
          currentStock: 200,
          minStockLevel: 100,
          maxStockLevel: 500,
          unit: 'pieces',
          pricePerUnit: 5,
          supplier: 'Hygiene Supplies Inc.',
          lastRestocked: '2025-01-12',
          isLowStock: false
        },
        {
          _id: '5',
          itemName: 'Disinfectant Spray',
          category: 'cleaning' as const,
          currentStock: 3,
          minStockLevel: 12,
          maxStockLevel: 30,
          unit: 'bottles',
          pricePerUnit: 180,
          supplier: 'Clean Pro',
          lastRestocked: '2024-12-20',
          expiryDate: '2025-12-20',
          isLowStock: true
        }
      ];
      setInventory(mockInventory);
    } finally {
      setIsLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = inventory;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (showLowStockOnly) {
      filtered = filtered.filter(item => item.isLowStock);
    }

    setFilteredInventory(filtered);
  };

  const handleAddItem = async () => {
    try {
      const itemData = {
        ...newItem,
        isLowStock: newItem.currentStock <= newItem.minStockLevel,
        lastRestocked: new Date().toISOString()
      };

      const response = await axios.post(`${BASE_URL}/api/inventory`, itemData, {
        withCredentials: true
      });

      setInventory([...inventory, response.data.item]);
      setShowAddItemForm(false);
      resetNewItem();
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      // For demo, add item locally
      const mockItem = {
        _id: Date.now().toString(),
        ...newItem,
        isLowStock: newItem.currentStock <= newItem.minStockLevel,
        lastRestocked: new Date().toISOString()
      };
      setInventory([...inventory, mockItem]);
      setShowAddItemForm(false);
      resetNewItem();
    }
  };

  const handleUpdateStock = async (itemId: string, newStock: number) => {
    try {
      await axios.patch(`${BASE_URL}/api/inventory/${itemId}/stock`, {
        currentStock: newStock
      }, {
        withCredentials: true
      });

      setInventory(inventory.map(item =>
        item._id === itemId
          ? { ...item, currentStock: newStock, isLowStock: newStock <= item.minStockLevel }
          : item
      ));
    } catch (error) {
      console.error('Failed to update stock:', error);
      // For demo, update locally
      setInventory(inventory.map(item =>
        item._id === itemId
          ? { ...item, currentStock: newStock, isLowStock: newStock <= item.minStockLevel }
          : item
      ));
    }
  };

  const resetNewItem = () => {
    setNewItem({
      itemName: '',
      category: 'hair_products',
      currentStock: 0,
      minStockLevel: 0,
      maxStockLevel: 0,
      unit: '',
      pricePerUnit: 0,
      supplier: '',
      expiryDate: ''
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      hair_products: 'Hair Products',
      skin_care: 'Skin Care',
      tools: 'Tools',
      consumables: 'Consumables',
      cleaning: 'Cleaning'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minStockLevel) {
      return { color: 'text-red-600 bg-red-50', label: 'Low Stock' };
    } else if (item.currentStock <= item.minStockLevel * 1.5) {
      return { color: 'text-yellow-600 bg-yellow-50', label: 'Medium Stock' };
    } else {
      return { color: 'text-green-600 bg-green-50', label: 'Good Stock' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CubeIcon className="h-6 w-6 mr-2 text-blue-600" />
            Inventory Management
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items or suppliers..."
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="hair_products">Hair Products</option>
                  <option value="skin_care">Skin Care</option>
                  <option value="tools">Tools</option>
                  <option value="consumables">Consumables</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                  className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">Low Stock Only</label>
              </div>
            </div>
            <button
              onClick={() => setShowAddItemForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>

          {/* Stock Alerts */}
          {filteredInventory.filter(item => item.isLowStock).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm font-medium text-red-800">
                  {filteredInventory.filter(item => item.isLowStock).length} items are running low on stock!
                </p>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min/Max</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-sm text-gray-500">₹{item.pricePerUnit}/{item.unit}</div>
                          {item.expiryDate && (
                            <div className="text-xs text-gray-400">
                              Expires: {new Date(item.expiryDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getCategoryLabel(item.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {item.currentStock} {item.unit}
                          </span>
                          <button
                            onClick={() => {
                              const newStock = prompt(`Update stock for ${item.itemName}:`, item.currentStock.toString());
                              if (newStock && !isNaN(Number(newStock))) {
                                handleUpdateStock(item._id, Number(newStock));
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.minStockLevel} / {item.maxStockLevel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.supplier}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            // Edit functionality would open edit form
                            console.log('Edit item:', item);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${item.itemName}?`)) {
                              setInventory(inventory.filter(i => i._id !== item._id));
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Item Form */}
        {showAddItemForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Inventory Item</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={newItem.itemName}
                    onChange={(e) => setNewItem({...newItem, itemName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value as InventoryItem['category']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="hair_products">Hair Products</option>
                    <option value="skin_care">Skin Care</option>
                    <option value="tools">Tools</option>
                    <option value="consumables">Consumables</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={newItem.currentStock}
                    onChange={(e) => setNewItem({...newItem, currentStock: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    placeholder="pieces, bottles, tubes, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    value={newItem.minStockLevel}
                    onChange={(e) => setNewItem({...newItem, minStockLevel: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
                  <input
                    type="number"
                    value={newItem.maxStockLevel}
                    onChange={(e) => setNewItem({...newItem, maxStockLevel: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit (₹)</label>
                  <input
                    type="number"
                    value={newItem.pricePerUnit}
                    onChange={(e) => setNewItem({...newItem, pricePerUnit: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddItemForm(false);
                    resetNewItem();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.itemName || !newItem.supplier}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagementModal;