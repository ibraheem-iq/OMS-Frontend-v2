// Importing necessary libraries and components
import React, { useState, useEffect } from "react"; // React hooks for state management and lifecycle
import "./ListOfValueAdmin.css"; // Styles for the component
import Icons from "./../../../reusable elements/icons.jsx"; // Custom icon components
import listOfValuesData from "./../../../data/ListOfValueAdmin.json"; // JSON data for the list of values
import {
  Table, // Ant Design Table component for displaying data
  Modal, // Ant Design Modal for pop-up dialogs
  Form, // Ant Design Form for form handling
  Input, // Ant Design Input component for text input
  Button, // Ant Design Button component
  message, // Ant Design message for notifications
  ConfigProvider, // Ant Design ConfigProvider for localization
  Select, // Ant Design Select component for dropdowns
  Space, // Ant Design Space for spacing components
} from "antd";
import axios from "axios"; // Axios for API requests
import Url from "./../../../store/url.js"; // Base URL configuration
import Config from "./../../../store/configrationOfListOfValue.js"; // Configuration for each list of value item

// Main functional component
export default function ListOfValueAdmin() {
  // Initializing states
  const { ListOfValues } = listOfValuesData; // Extracting list of values from JSON

  const [selectedData, setSelectedData] = useState([]); // Holds data to display in the table
  const [loading, setLoading] = useState(false); // Loading state for API requests
  const [columns, setColumns] = useState([]); // Table columns configuration
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const [isEditMode, setIsEditMode] = useState(false); // Determines if modal is in edit or add mode
  const [selectedConfig, setSelectedConfig] = useState(null); // Holds the configuration for the selected item
  const [formFields, setFormFields] = useState([]); // Holds form fields for the selected item
  const [form] = Form.useForm(); // Ant Design form instance
  const [editingId, setEditingId] = useState(null); // ID of the record being edited
  const [currentPath, setCurrentPath] = useState(null); // Current selected item's path
  const [currentLabel, setCurrentLabel] = useState("تفاصيل القيمة"); // Current label displayed as the section title

  // Axios instance with base URL and authorization header
  const api = axios.create({
    baseURL: Url,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`, // Token retrieved from localStorage
    },
  });

  // Runs whenever `currentPath` changes to fetch data and set up columns/form fields
  useEffect(() => {
    if (currentPath && selectedConfig) {
      fetchData(selectedConfig.getEndpoint); // Fetch data for the selected path
      setupColumnsAndFormFields(); // Configure table columns and form fields
    }
  }, [currentPath]); // Dependency array to track changes to `currentPath`

  // Configures table columns and form fields based on the selected configuration
  const setupColumnsAndFormFields = () => {
    const enhancedColumns = [
      ...selectedConfig.columns, // Adding columns from the selected configuration
      {
        title: "إجراءات", // Title for actions column
        key: "actions", // Key for the column
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              onClick={() => handleEdit(record)} // Opens modal for editing
              disabled={loading} // Disables button while loading
            >
              تعديل
            </Button>
            <Button
              type="link"
              danger
              onClick={() => handleDelete(record.id)} // Deletes the record
              disabled={loading} // Disables button while loading
            >
              حذف
            </Button>
          </Space>
        ),
      },
    ];

    setColumns(enhancedColumns); // Update table columns
    setFormFields(selectedConfig.formFields); // Update form fields
  };

  // Handles clicking on a list item to load its data
  const handleItemClick = (item) => {
    const selected = Config[item.path]; // Fetch configuration based on the path
    if (!selected) {
      message.error("لم يتم العثور على التكوين المطلوب"); // Error message if config is not found
      return;
    }
    setCurrentPath(item.path); // Update the current path
    setSelectedConfig(selected); // Set the selected configuration
    setCurrentLabel(item.label); // Update the label displayed at the top
  };

  // Fetches data from the API for the selected item
  const fetchData = async (endpoint) => {
    setLoading(true); // Set loading to true while fetching
    try {
      const response = await api.get(endpoint); // Make GET request
      const formattedData = response.data.map((item) => ({
        ...item,
        key: item.id?.toString() || Math.random().toString(), // Add a unique key for each record
      }));
      setSelectedData(formattedData); // Update state with fetched data
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("فشل تحميل البيانات"); // Error message
      setSelectedData([]); // Reset data on failure
    } finally {
      setLoading(false); // Set loading to false after completion
    }
  };

  // Handles adding a new record
  const handleAdd = async (values) => {
    if (!selectedConfig) {
      message.error("الرجاء اختيار نوع البيانات أولاً"); // Error message if no item is selected
      return;
    }

    setLoading(true);
    try {
      const endpoint = selectedConfig.postEndpoint; // POST endpoint from config
      await api.post(endpoint, values); // Make POST request with form values

      message.success("تمت إضافة البيانات بنجاح"); // Success message
      setIsModalOpen(false); // Close modal
      form.resetFields(); // Reset form
      await fetchData(selectedConfig.getEndpoint); // Refresh table data
    } catch (error) {
      console.error("Error adding record:", error);
      message.error("حدث خطأ أثناء الإضافة"); // Error message
    } finally {
      setLoading(false);
    }
  };

  // Handles updating an existing record
  const handleUpdate = async (values) => {
    if (!selectedConfig || !editingId) {
      message.error("بيانات التحديث غير مكتملة"); // Error message if data is incomplete
      return;
    }

    setLoading(true);
    try {
      let endpoint = selectedConfig.putEndpoint(editingId); // PUT endpoint from config
      let payload = { id: editingId, ...values }; // Default payload structure

      switch (currentPath) {
        case "/admin/add-office": // Special handling for offices
          endpoint = `/api/office/${editingId}`; // Custom endpoint
          payload = {
            officeId: parseInt(editingId),
            ...values,
            code: parseInt(values.code), // Ensure integers for certain fields
            receivingStaff: parseInt(values.receivingStaff),
            accountStaff: parseInt(values.accountStaff),
            printingStaff: parseInt(values.printingStaff),
            qualityStaff: parseInt(values.qualityStaff),
            deliveryStaff: parseInt(values.deliveryStaff),
            governorateId: parseInt(values.governorateId),
          };
          break;
        // Other case-specific adjustments here if needed
      }

      console.log("Updating record at:", endpoint);
      console.log("Payload:", payload);

      const response = await api.put(endpoint, payload); // Make PUT request

      if (response.status === 200 || response.status === 204) {
        message.success("تم تحديث البيانات بنجاح"); // Success message
        setIsModalOpen(false); // Close modal
        form.resetFields(); // Reset form
        await fetchData(selectedConfig.getEndpoint); // Refresh data
        setIsEditMode(false);
        setEditingId(null);
      } else {
        throw new Error("Failed to update record."); // Throw error if response is invalid
      }
    } catch (error) {
      console.error("Error updating record:", error);
      message.error("فشل تحديث السجل. تحقق من البيانات أو الاتصال بالخادم."); // Error message
    } finally {
      setLoading(false);
    }
  };

  // Handles deleting a record
  const handleDelete = async (id) => {
    if (!id || !selectedConfig) {
      message.error("معرف السجل غير متوفر");
      return;
    }

    Modal.confirm({
      title: "تأكيد الحذف",
      content: "هل أنت متأكد من حذف هذا السجل؟",
      okText: "نعم",
      cancelText: "لا",
      onOk: async () => {
        setLoading(true);
        try {
          const endpoint = selectedConfig.deleteEndpoint(id);
          const response = await api.delete(endpoint);

          if (response.status === 200 || response.status === 204) {
            message.success("تم حذف السجل بنجاح");
            await fetchData(selectedConfig.getEndpoint);
          } else {
            throw new Error("Failed to delete record.");
          }
        } catch (error) {
          console.error("Error deleting record:", error);
          message.error("فشل حذف السجل. تحقق من الاتصال بالخادم.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Opens modal with data for editing
  const handleEdit = (record) => {
    if (!record.id) {
      message.error("معرف السجل غير متوفر");
      return;
    }

    setIsEditMode(true);
    setEditingId(record.id); // Set the ID of the record being edited
    setIsModalOpen(true); // Open the modal
    form.setFieldsValue(record); // Populate the form with record data
  };

  // Opens modal for adding a new record
  const handleAddNew = () => {
    if (!selectedConfig) {
      message.error("الرجاء اختيار نوع البيانات أولاً");
      return;
    }

    setIsEditMode(false);
    setEditingId(null);
    form.resetFields(); // Clear the form
    setIsModalOpen(true); // Open the modal
  };

  // Renders individual form fields based on configuration
  const renderFormField = (field) => {
    switch (field.type) {
      case "dropdown":
        return (
          <Select>
            {(field.options || []).map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );
      case "date":
        return <Input type="date" />;
      case "number":
        return <Input type="number" />;
      default:
        return <Input type={field.type || "text"} />;
    }
  };

  // Render the component
  return (
    <div className="list-of-value-container" dir="rtl">
      <div className="list-of-value-bar">
        <ul className="list-of-value-items">
          {ListOfValues.map((item, index) => (
            <li
              key={index}
              className={`list-of-value-item ${
                currentPath === item.path ? "active" : ""
              }`}
              onClick={() => handleItemClick(item)}
            >
              <a className="list-of-value-link">
                <Icons type={item.icon} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="list-of-value-details-section-left">
        <div className="top-list-of-value-details-section-left">
          <h2>{currentLabel}</h2>
          <Button
            type="primary"
            onClick={handleAddNew}
            disabled={!selectedConfig || loading}
          >
            إضافة <Icons type="add" />
          </Button>
        </div>

        <ConfigProvider direction="rtl">
          <Table
            columns={columns}
            dataSource={selectedData}
            loading={loading}
            pagination={{
              pageSize: 10,
              position: ["bottomCenter"],
              showSizeChanger: true,
              showTotal: (total) => `إجمالي السجلات: ${total}`,
            }}
            bordered
            locale={{ emptyText: "لا توجد بيانات" }}
          />
        </ConfigProvider>
      </div>

      <Modal
        title={isEditMode ? "تعديل القيمة" : "إضافة قيمة جديدة"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingId(null);
          setIsEditMode(false);
          form.resetFields();
        }}
        footer={null}
        maskClosable={false}
      >
        <Form
          form={form}
          onFinish={isEditMode ? handleUpdate : handleAdd}
          layout="vertical"
        >
          {formFields.map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={[{ required: true, message: `الرجاء إدخال ${field.label}` }]}
            >
              {renderFormField(field)}
            </Form.Item>
          ))}
          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setIsEditMode(false);
                  form.resetFields();
                }}
              >
                إلغاء
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEditMode ? "تحديث" : "إضافة"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}