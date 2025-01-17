import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Table, Card, Typography, ConfigProvider, message, Button, Modal, Input, Space } from 'antd';
import { Link } from 'react-router-dom';
import { SendOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axiosInstance from '../../../intercepters/axiosInstance';
import useAuthStore from '../../../store/store';
import './styles/ExpensessViewMonthly.css';

const { Title } = Typography;
const { TextArea } = Input;

export default function ExpensessViewMonthly() {
    const location = useLocation();
    const navigate = useNavigate();
    const { monthlyExpenseId } = location.state || {};
    const { isSidebarCollapsed, profile } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [sendingLoading, setSendingLoading] = useState(false);
    const [monthlyExpense, setMonthlyExpense] = useState(null);
    const [dailyExpenses, setDailyExpenses] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [notes, setNotes] = useState('');
    const [completingLoading, setCompletingLoading] = useState(false);

    const fetchMonthlyExpenseDetails = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/Expense/${monthlyExpenseId}`);
            setMonthlyExpense(response.data);
        } catch (error) {
            console.error('Error fetching monthly expense:', error);
            message.error('حدث خطأ في جلب تفاصيل المصروف الشهري');
        }
    };

    const fetchDailyExpenses = async () => {
        try {
            const response = await axiosInstance.get(`/api/Expense/${monthlyExpenseId}/daily-expenses`);
            const formattedExpenses = response.data.map(expense => ({
                key: expense.id,
                id: expense.id,
                date: new Date(expense.expenseDate).toISOString().split('T')[0],
                price: expense.price,
                quantity: expense.quantity,
                totalAmount: expense.amount,
                notes: expense.notes,
                expenseTypeName: expense.expenseTypeName
            }));
            setDailyExpenses(formattedExpenses);
        } catch (error) {
            console.error('Error fetching daily expenses:', error);
            message.error('حدث خطأ في جلب المصروفات اليومية');
        } finally {
            setLoading(false);
        }
    };

    const handleSendToCoordinator = async () => {
        try {
            setSendingLoading(true);

            // First update the status
            await axiosInstance.post(`/api/Expense/${monthlyExpenseId}/status`, {
                monthlyExpensesId: monthlyExpenseId,
                newStatus: 1,
                notes: notes || "Monthly expenses marked as completed by the Manager."
            });

            // Then create an action
            await axiosInstance.post('/api/Actions', {
                actionType: "Approval",
                notes: notes || "Approved for processing.",
                profileId: profile?.profileId,
                monthlyExpensesId: monthlyExpenseId
            });

            message.success('تم إرسال المصروف بنجاح إلى منسق المشروع');
            setIsModalVisible(false);
            // Navigate back
            navigate(-1);
            
        } catch (error) {
            console.error('Error sending to coordinator:', error);
            message.error('حدث خطأ في إرسال المصروف');
        } finally {
            setSendingLoading(false);
        }
    };

    const handleCompleteMonthlyExpense = async () => {
        try {
            setCompletingLoading(true);
            
            // Update status to Completed (9)
            await axiosInstance.post(`/api/Expense/${monthlyExpenseId}/status`, {
                monthlyExpensesId: monthlyExpenseId,
                newStatus: 9,
                notes: "Monthly expenses completed by Supervisor"
            });

            message.success('تم اتمام عملية مصاريف الشهر بنجاح');
            // Navigate back
            navigate(-1);
            
        } catch (error) {
            console.error('Error completing monthly expense:', error);
            message.error('حدث خطأ في اتمام عملية مصاريف الشهر');
        } finally {
            setCompletingLoading(false);
        }
    };

    useEffect(() => {
        if (monthlyExpenseId) {
            fetchMonthlyExpenseDetails();
            fetchDailyExpenses();
        }
    }, [monthlyExpenseId]);

    const columns = [
        {
            title: 'التاريخ',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'نوع المصروف',
            dataIndex: 'expenseTypeName',
            key: 'expenseTypeName',
        },
        {
            title: 'السعر',
            dataIndex: 'price',
            key: 'price',
            render: (amount) => (
                <span className="monthly-info-value amount">
                    {amount.toLocaleString()} د.ع
                </span>
            ),
        },
        {
            title: 'الكمية',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'المبلغ الإجمالي',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount) => (
                <span className="monthly-info-value amount">
                    {amount.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                    })} د.ع
                </span>
            ),
        },
        
        {
            title: 'ملاحظات',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
        },
        {
            title: 'الإجراءات',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Link to="/Expensess-view-daily" state={{ dailyExpenseId: record.id }}>
                        <Button type="primary" className="action-button">عرض</Button>
                    </Link>
                </Space>
            ),
        },
    ];

    const MonthlyExpenseInfo = () => {
        if (!monthlyExpense) return null;

        const getStatusClass = (status) => {
            const statusMap = {
                'ReturnedToSupervisor': 'status-returned',
                'Low': 'status-low',
                'RecievedBySupervisor': 'status-received',
                'Completed': 'status-completed'
            };
            return statusMap[status] || '';
        };

        return (
            <Card className="monthly-info-card">
                <div className="monthly-info-grid">
                    <div>
                        <div className="monthly-info-item">
                            <span className="monthly-info-label">المبلغ الإجمالي:</span>
                            <span className="monthly-info-value amount">
                                {monthlyExpense.totalAmount?.toLocaleString()} د.ع
                            </span>
                        </div>
                        <div className="monthly-info-item">
                            <span className="monthly-info-label">حالة الطلب:</span>
                            <span className={`monthly-info-value ${getStatusClass(monthlyExpense.status)}`}>
                                {monthlyExpense.status}
                            </span>
                        </div>
                        <div className="monthly-info-item">
                            <span className="monthly-info-label">اسم المكتب:</span>
                            <span className="monthly-info-value">{monthlyExpense.officeName}</span>
                        </div>
                        <div className="monthly-info-item">
                            <span className="monthly-info-label">المحافظة:</span>
                            <span className="monthly-info-value">{monthlyExpense.governorateName}</span>
                        </div>
                    </div>
                    <div>
                        <div className="monthly-info-item">
                            <span className="monthly-info-label">اسم المشرف:</span>
                            <span className="monthly-info-value">{monthlyExpense.profileFullName}</span>
                        </div>
                        <div className="monthly-info-item">
                            <span className="monthly-info-label">مستوى الإنفاق:</span>
                            <span className="monthly-info-value">{monthlyExpense.thresholdName}</span>
                        </div>
                        <div className="monthly-info-item">
                            <span className="monthly-info-label">تاريخ الإنشاء:</span>
                            <span className="monthly-info-value">
                                {new Date(monthlyExpense.dateCreated).toLocaleDateString('en')}
                            </span>
                        </div>
                        <div className="monthly-info-item">
                            <span className="monthly-info-label">ملاحظات:</span>
                            <span className="monthly-info-value">
                                {monthlyExpense.notes || 'لا توجد ملاحظات'}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    const renderActionButton = () => {
        if (monthlyExpense?.status === 'RecievedBySupervisor') {
            return (
                <Button 
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={handleCompleteMonthlyExpense}
                    loading={completingLoading}
                    className="send-button"
                >
                    اتمام عملية مصاريف الشهر
                </Button>
            );
        }
        
        if (!['Completed', 'RecievedBySupervisor'].includes(monthlyExpense?.status)) {
            return (
                <Button 
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => setIsModalVisible(true)}
                    className="send-button"
                >
                    ارسال الى منسق المشروع بعد التعديل
                </Button>
            );
        }

        return null;
    };

    return (
        <div className={`monthly-expense-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} dir="rtl">
            <Card className="monthly-expense-card">
                <div className="monthly-expense-header">
                    <div className="header-content">
                        <Title level={3} className="monthly-expense-title">تفاصيل المصروف الشهري</Title>
                        {renderActionButton()}
                    </div>
                </div>
                
                <MonthlyExpenseInfo />

                <ConfigProvider direction="rtl">
                    <Table
                        className="expenses-table"
                        dataSource={dailyExpenses}
                        columns={columns}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            position: ['bottomCenter'],
                            showSizeChanger: false,
                        }}
                    />
                </ConfigProvider>
            </Card>

            <Modal
                title="إرسال المصروف الى منسق المشروع"
                open={isModalVisible}
                onOk={handleSendToCoordinator}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={sendingLoading}
                okText="إرسال"
                cancelText="إلغاء"
                dir="rtl"
            >
                <div style={{ marginTop: '16px' }}>
                    <TextArea
                        rows={4}
                        placeholder="أدخل الملاحظات..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </Modal>
        </div>
    );
}