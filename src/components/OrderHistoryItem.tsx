"use client";

import type { Order } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Truck, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { fetchReturnRequests, createReturnRequest, cancelOrder } from '@/services/api';

interface OrderHistoryItemProps {
  order: Order;
}

interface ReturnRequest {
  _id: string;
  itemId: string;
  type: 'return' | 'exchange';
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  processedAt?: string;
  quantity: number;
  exchangeForSize?: string;
  exchangeForColor?: string;
  adminNotes?: string;
}

const getStatusStyles = (status: Order['status']) => {
  switch (status) {
    case 'Pending':
      return { icon: <Clock size={16} className="mr-1.5" />, color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50', label: 'Pending' };
    case 'Processing':
      return { icon: <Package size={16} className="mr-1.5" />, color: 'bg-blue-500/20 text-blue-700 border-blue-500/50', label: 'Processing' };
    case 'Shipped':
      return { icon: <Truck size={16} className="mr-1.5" />, color: 'bg-purple-500/20 text-purple-700 border-purple-500/50', label: 'Shipped' };
    case 'Delivered':
      return { icon: <CheckCircle size={16} className="mr-1.5" />, color: 'bg-green-500/20 text-green-700 border-green-500/50', label: 'Delivered' };
    case 'Cancelled':
      return { icon: <XCircle size={16} className="mr-1.5" />, color: 'bg-red-500/20 text-red-700 border-red-500/50', label: 'Cancelled' };
    default:
      return { icon: <Clock size={16} className="mr-1.5" />, color: 'bg-gray-500/20 text-gray-700 border-gray-500/50', label: 'Unknown' };
  }
};

const OrderHistoryItem: React.FC<OrderHistoryItemProps> = ({ order }) => {
  const statusStyle = getStatusStyles(order.status);

  const shippingAddressString = order.shippingAddress
    ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`
    : 'Shipping address not available';

  // Return/Exchange state
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogItem, setDialogItem] = useState<any>(null);
  const [formType, setFormType] = useState<'return' | 'exchange'>('return');
  const [formReason, setFormReason] = useState('');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formExchangeSize, setFormExchangeSize] = useState('');
  const [formExchangeColor, setFormExchangeColor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    fetchReturnRequests(order.id).then(res => {
      setReturns(res.returns || []);
    }).catch(() => setReturns([]));
  }, [order.id]);

  const handleOpenDialog = (item: any) => {
    setDialogItem(item);
    setFormType('return');
    setFormReason('');
    setFormQuantity(1);
    setFormExchangeSize('');
    setFormExchangeColor('');
    setError('');
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formReason.trim()) {
      setError('Please provide a reason.');
      return;
    }
    setSubmitting(true);
    try {
      await createReturnRequest(order.id, {
        itemId: dialogItem.productId,
        type: formType,
        reason: formReason,
        quantity: formQuantity,
        exchangeForSize: formType === 'exchange' ? formExchangeSize : undefined,
        exchangeForColor: formType === 'exchange' ? formExchangeColor : undefined,
      });
      setShowDialog(false);
      // Refresh returns
      const res = await fetchReturnRequests(order.id);
      setReturns(res.returns || []);
    } catch (e: any) {
      setError(e.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      await cancelOrder(order.id);
      // Optionally, refetch order status or update locally
      window.location.reload(); // simplest way to refresh status
    } catch (e: any) {
      setCancelError(e.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-none">
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center pb-3">
        <div>
          <CardTitle className="text-xl font-headline">Order #{order.id.substring(0,8)}</CardTitle>
          <CardDescription>
            Placed on: {new Date(order.createdAt).toLocaleDateString()}
          </CardDescription>
        </div>
        <Badge variant="outline" className={`px-3 py-1 text-sm ${statusStyle.color} flex items-center mt-2 sm:mt-0`}>
            {statusStyle.icon} {statusStyle.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {order.items.map(item => {
            const itemReturn = returns.find(r => r.itemId === item.productId);
            return (
              <div key={item.productId} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                <div className="relative w-16 h-16 rounded-none overflow-hidden">
                  <Image 
                    src={item.productImage || "https://placehold.co/100x100.png"} 
                    alt={item.productName || 'Product Image'} 
                    layout="fill" 
                    objectFit="cover"
                    data-ai-hint="ordered product clothing"
                  />
                </div>
                <div>
                  <p className="font-medium">{item.productName || 'Product Name Unavailable'}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity} x ₹{item.price.toFixed(2)}
                  </p>
                  {itemReturn ? (
                    <p className="text-xs mt-1">
                      <span className="font-semibold">Return/Exchange Status:</span> {itemReturn.status} ({itemReturn.type})
                      {itemReturn.reason && <span className="ml-2 italic">Reason: {itemReturn.reason}</span>}
                    </p>
                  ) : (
                    order.status === 'Delivered' && (
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => handleOpenDialog(item)}>
                        Return/Exchange
                      </Button>
                    )
                  )}
                </div>
                <p className="ml-auto font-medium">₹{(item.quantity * item.price).toFixed(2)}</p>
              </div>
            );
          })}
        </div>
        <Separator className="my-3"/>
         <div className="text-sm text-muted-foreground">
            <p><span className="font-medium">Shipping Address:</span> {shippingAddressString}</p>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 p-4 flex justify-end items-center">
        <p className="text-lg font-semibold">Total: <span className="text-primary">₹{order.totalAmount.toFixed(2)}</span></p>
        {(order.status === 'Pending' || order.status === 'Processing') && (
          <Button
            variant="destructive"
            size="sm"
            className="ml-4"
            onClick={handleCancelOrder}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        )}
        {order.status === 'Cancelled' && (
          <span className="ml-4 text-red-600 font-semibold">Order Cancelled</span>
        )}
        {cancelError && <span className="ml-4 text-red-500 text-sm">{cancelError}</span>}
      </CardFooter>

      {/* Return/Exchange Modal */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Return/Exchange</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={formType} onValueChange={v => setFormType(v as 'return' | 'exchange')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="return">Return</SelectItem>
                <SelectItem value="exchange">Exchange</SelectItem>
              </SelectContent>
            </Select>
            <Textarea value={formReason} onChange={e => setFormReason(e.target.value)} placeholder="Reason for return/exchange" />
            <Input type="number" min={1} value={formQuantity} onChange={e => setFormQuantity(Number(e.target.value))} placeholder="Quantity" />
            {formType === 'exchange' && (
              <>
                <Input value={formExchangeSize} onChange={e => setFormExchangeSize(e.target.value)} placeholder="Exchange for Size (optional)" />
                <Input value={formExchangeColor} onChange={e => setFormExchangeColor(e.target.value)} placeholder="Exchange for Color (optional)" />
              </>
            )}
            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OrderHistoryItem;

