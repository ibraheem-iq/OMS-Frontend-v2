import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/store.js";
import Icons from "./icons.jsx";

const DynamicSidebar = ({
  fetchUrl,
  onLogout,
  currentPath,
  sidebarClassName,
  menuItemClassName,
  activeMenuItemClassName,
  logoutClassName,
}) => {
  const { user } = useAuthStore(); // Access user from Zustand store
  const [roleItems, setRoleItems] = useState([]); // Menu items based on role
  const navigate = useNavigate();

  // Fetch sidebar data based on role
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        if (!user || !user.role) return;

        if (typeof fetchUrl === "string") {
          const response = await fetch(fetchUrl);
          const data = await response.json();
          setRoleItems(data[user.role] || []);
        } else if (typeof fetchUrl === "object") {
          setRoleItems(fetchUrl[user.role] || []);
        } else {
          throw new Error("Invalid fetchUrl format. Must be a URL or JSON object.");
        }
      } catch (error) {
        console.error("Failed to fetch sidebar data:", error.message);
      }
    };

    fetchSidebarData();
  }, [fetchUrl, user]);

  // Common menu items for all users
  const commonItems = [
    { label: "الإعدادات", icon: "settings", path: "/settings" },
    { label: "تسجيل الخروج", icon: "logout", action: onLogout },
  ];

  // Handle menu clicks (navigation or actions)
  const handleMenuClick = (path, action) => {
    if (action) {
      action();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <div className={sidebarClassName || "sidebar"} dir="rtl">
      {/* Role-based menu items */}
      <div className="sidebar-top" dir="ltr">
        {roleItems.length > 0 ? (
          roleItems.map((item, index) => (
            <div
              key={index}
              className={`${menuItemClassName} ${
                currentPath === item.path ? activeMenuItemClassName : ""
              }`}
              style={{
                color: currentPath === item.path ? "white" : "black",
              }}
              onClick={() => handleMenuClick(item.path, item.action)}
            >
              <span
                className="icons-sidebar-adjusment"
                style={{
                  backgroundColor: currentPath === item.path ? "#4880ff" : "transparent",
                  color: currentPath === item.path ? "white" : "black",
                }}
              >
                <Icons
                  type={item.icon}
                  width={40}
                  height={40}
                  color={currentPath === item.path ? "white" : "black"}
                />
              </span>
              <h3>{item.label}</h3>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "gray" }}>No items available</p>
        )}
      </div>

      {/* Common items */}
      <div className="sidebar-bottom" dir="ltr">
        {commonItems.map((item, index) => (
          <div
            key={index}
            className={`${item.label === "تسجيل الخروج" ? logoutClassName : menuItemClassName} ${
              currentPath === item.path ? activeMenuItemClassName : ""
            }`}
            onClick={() => handleMenuClick(item.path, item.action)}
          >
            <Icons
              type={item.icon}
              width={24}
              height={24}
              color={item.label === "تسجيل الخروج" ? "white" : "black"}
            />
            <h3>{item.label}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

DynamicSidebar.propTypes = {
  fetchUrl: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  onLogout: PropTypes.func.isRequired,
  currentPath: PropTypes.string.isRequired,
  sidebarClassName: PropTypes.string,
  menuItemClassName: PropTypes.string,
  activeMenuItemClassName: PropTypes.string,
  logoutClassName: PropTypes.string,
};

export default DynamicSidebar;
