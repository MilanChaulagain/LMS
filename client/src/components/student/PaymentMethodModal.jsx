import { useState } from 'react';
import PropTypes from 'prop-types';
import { assets } from '../../assets/assets';

const PaymentMethodModal = ({ isOpen, onClose, onSelectPayment, courseData, currency }) => {
  const [selectedMethod, setSelectedMethod] = useState('khalti');

  if (!isOpen) return null;

  const finalAmount = (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2);

  const handlePayment = () => {
    onSelectPayment(selectedMethod);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select Payment Method</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <img src={assets.cross_icon} alt="Close" className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <h3 className="font-medium mb-2">{courseData.courseTitle}</h3>
          <p className="text-2xl font-semibold text-green-600">{currency} {finalAmount}</p>
        </div>

        <div className="space-y-3 mb-6">
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedMethod === 'khalti' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
            }`}
            onClick={() => setSelectedMethod('khalti')}
          >
            <div className="flex items-center">
              <input
                type="radio"
                value="khalti"
                checked={selectedMethod === 'khalti'}
                onChange={() => setSelectedMethod('khalti')}
                className="mr-3"
              />
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <div>
                  <h4 className="font-medium">Khalti</h4>
                  <p className="text-sm text-gray-500">Digital wallet payment</p>
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedMethod === 'esewa' ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
            onClick={() => setSelectedMethod('esewa')}
          >
            <div className="flex items-center">
              <input
                type="radio"
                value="esewa"
                checked={selectedMethod === 'esewa'}
                onChange={() => setSelectedMethod('esewa')}
                className="mr-3"
              />
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <div>
                  <h4 className="font-medium">eSewa</h4>
                  <p className="text-sm text-gray-500">Digital payment service</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Proceed to Pay
          </button>
        </div>
      </div>
    </div>
  );
};

PaymentMethodModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectPayment: PropTypes.func.isRequired,
  courseData: PropTypes.shape({
    courseTitle: PropTypes.string.isRequired,
    coursePrice: PropTypes.number.isRequired,
    discount: PropTypes.number.isRequired
  }).isRequired,
  currency: PropTypes.string.isRequired
};

export default PaymentMethodModal;