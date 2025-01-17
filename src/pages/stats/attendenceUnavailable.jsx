import React, { useState, useEffect } from 'react';
import { DatePicker, Select, Button, Card, Alert, Row } from 'antd';
import axiosInstance from '../../intercepters/axiosInstance.js';
import Url from './../../store/url.js';

const { Option } = Select;

const containerStyle = {
  padding: '24px'
};

const formContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-end',
  gap: '20px',
  marginBottom: '16px',
  flexWrap: 'wrap'
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const labelStyle = {
  marginBottom: '8px',
  color: '#262626',
  fontWeight: 500
};

const selectStyle = {
  width: '200px'
};

const buttonStyle = {
  
  height:"45px",
  width:"100px"
};

const cardsContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '16px',
  marginTop: '16px'
};

const cardStyle = {
  flex: '0 0 auto',
  minWidth: '200px',
  maxWidth: '300px',
  backgroundColor: '#fff1f0',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #ffccc7'
};

const cardTextStyle = {
  color: '#cf1322',
  fontSize: '16px',
  fontWeight: 500
};

const emptyStateStyle = {
  textAlign: 'center',
  color: '#8c8c8c',
  marginTop: 24,
  width: '100%'
};

export default function AttendanceUnavailable() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [workingHours, setWorkingHours] = useState('3');
  const [governorates, setGovernorates] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [unavailableOffices, setUnavailableOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGovernorates = async () => {
      try {
        const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown`);
        setGovernorates([{ id: null, name: 'الكل' }, ...response.data]);
      } catch (err) {
        console.error('Error fetching governorates:', err);
      }
    };

    fetchGovernorates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      setError('الرجاء اختيار التاريخ');
      return;
    }

    setLoading(true);
    setError(null);
    setUnavailableOffices([]);

    try {
      const response = await axiosInstance.post(`${Url}/api/Attendance/statistics/unavailable`, {
        date: `${selectedDate.format('YYYY-MM-DD')}T00:00:00Z`,
        workingHours: parseInt(workingHours),
        governorateId: selectedGovernorate
      });

      setUnavailableOffices(response.data);
    } catch (err) {
      setError('حدث خطأ اثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" style={containerStyle}>
      <Card title="مكاتب الغياب" bordered={false}>
        <form onSubmit={handleSubmit}>
          <div style={formContainerStyle}>
            <div style={formGroupStyle}>
              <div style={labelStyle}>التاريخ</div>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                style={selectStyle}
                placeholder="اختر التاريخ"
              />
            </div>

            <div style={formGroupStyle}>
              <div style={labelStyle}>وقت الدوام</div>
              <Select
                value={workingHours}
                onChange={setWorkingHours}
                style={selectStyle}
              >
                <Option value="1">صباحي</Option>
                <Option value="2">مسائي</Option>
                <Option value="3">الكل</Option>
              </Select>
            </div>

            <div style={formGroupStyle}>
              <div style={labelStyle}>المحافظة</div>
              <Select
                value={selectedGovernorate}
                onChange={setSelectedGovernorate}
                style={selectStyle}
                placeholder="اختر المحافظة"
              >
                {governorates.map((gov) => (
                  <Option key={gov.id} value={gov.id}>
                    {gov.name}
                  </Option>
                ))}
              </Select>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={buttonStyle}
            >
              بحث
            </Button>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {unavailableOffices.length > 0 ? (
            <div style={cardsContainerStyle}>
              {unavailableOffices.map((office, index) => (
                <div key={index} style={cardStyle}>
                  <div style={cardTextStyle}>
                    {office}
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && !error && (
            <div style={emptyStateStyle}>
              لا توجد بيانات للعرض
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}