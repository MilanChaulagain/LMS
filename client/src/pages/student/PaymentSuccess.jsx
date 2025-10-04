import { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/student/Loading';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const { backendUrl } = useContext(AppContext);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Check if it's Khalti payment
        const pidx = searchParams.get('pidx');
        const purchaseOrderId = searchParams.get('purchase_order_id');
        
        // Check if it's eSewa payment
        const data = searchParams.get('data');

        if (pidx && purchaseOrderId) {
          // Verify Khalti payment
          const response = await axios.post(`${backendUrl}/api/user/verify-khalti-payment`, {
            pidx,
            purchase_order_id: purchaseOrderId
          });

          if (response.data.success) {
            toast.success('Payment successful! You are now enrolled in the course.');
            navigate('/my-enrollments');
          } else {
            toast.error('Payment verification failed.');
            navigate('/');
          }
        } else if (data) {
          // Verify eSewa payment
          const response = await axios.get(`${backendUrl}/api/user/verify-esewa-payment?data=${data}`);

          if (response.data.success) {
            toast.success('Payment successful! You are now enrolled in the course.');
            navigate('/my-enrollments');
          } else {
            toast.error('Payment verification failed.');
            navigate('/');
          }
        } else {
          toast.error('Invalid payment data.');
          navigate('/');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Payment verification failed.');
        navigate('/');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, backendUrl]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentSuccess;