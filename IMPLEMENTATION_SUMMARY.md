# Dynamic Lead Table Fields - Implementation Summary

## ✅ What Has Been Implemented

### 1. Database Schema
- **Plan Model** (`server/src/models/plan.model.js`):
  - Added `leadTables` (JSON array) - stores selected table names
  - Added `leadTableFields` (JSON object) - stores field configuration per table
  - Format: `{ "table_name": ["field1", "field2", ...] }`

### 2. Backend API

#### New Endpoint:
- **GET** `/api/admin/lead-tables/:tableName/fields`
  - Returns available fields for a specific table
  - Excludes system fields (id, created_at, updated_at)
  - Used by admin to select which fields to show

#### Updated Endpoints:
- **POST/PUT** `/plans` - Now handles `leadTableFields` configuration
- **GET** `/user/plan/:planId/leads?tableName=xxx` - Returns filtered fields based on plan configuration

### 3. Admin Interface (`client/src/pages/admin/Plans/PlanModal.jsx`)

**Features:**
- ✅ Select multiple lead tables for a plan
- ✅ For each table, fetch and display available fields
- ✅ Checkbox selection for which fields subscribers can see
- ✅ "Select All" / "Deselect All" buttons
- ✅ Visual feedback showing selected fields
- ✅ Warning if no fields selected (shows all by default)

**UI Flow:**
1. Admin checks "Insurance Leads" table
2. System fetches fields: name, email, phone, city, insurance_type, age, company
3. Admin selects specific fields: name, email, phone, insurance_type
4. Configuration saved to plan

### 4. User Interface (`client/src/pages/user/Leads.jsx`)

**Features:**
- ✅ Dynamic table columns based on actual data
- ✅ Respects admin's field selection
- ✅ Smart field rendering:
  - Email fields → clickable mailto links with icon
  - Phone fields → clickable tel links with icon
  - Website/URL fields → clickable links with external icon
  - Company/Business → building icon
  - Default → plain text with appropriate icon
- ✅ Visual indicator showing restricted field access
- ✅ Dynamic search across all visible fields
- ✅ Sortable columns
- ✅ Field count display

**UI Enhancements:**
- Blue info box showing which fields are accessible
- Field names formatted nicely (snake_case → Title Case)
- Icons automatically assigned based on field names
- Responsive table with horizontal scroll

### 5. Data Flow

```
Elementor Form Submission
    ↓
Webhook: /collect-lead
    ↓
Data stored in Supabase table (e.g., "insurance_leads")
    ↓
Admin creates plan:
  - Selects "insurance_leads" table
  - Chooses fields: name, email, phone, insurance_type
    ↓
User subscribes to plan
    ↓
User views leads:
  - Only sees selected fields
  - Data filtered on backend
  - Table renders dynamically
```

## 🎯 Key Features

### For Admins:
1. **Flexible Configuration**: Select any combination of fields per table
2. **Multiple Tables**: One plan can include multiple lead sources
3. **Visual Feedback**: See exactly what subscribers will access
4. **Easy Management**: Checkbox interface with select all option

### For Subscribers:
1. **Clean Interface**: Only see relevant fields
2. **Smart Rendering**: Fields displayed with appropriate formatting
3. **Full Functionality**: Search, sort, and filter across visible fields
4. **Transparency**: Clear indication of field restrictions

## 📊 Example Data Structure

### Plan Configuration:
```json
{
  "id": 1,
  "name": "Premium Insurance Plan",
  "leadTables": ["insurance_leads", "jewellary_leads"],
  "leadTableFields": {
    "insurance_leads": ["name", "email", "phone", "insurance_type", "age"],
    "jewellary_leads": ["name", "email", "phone", "city", "company"]
  }
}
```

### API Response to User:
```json
{
  "leads": [
    {
      "id": 4,
      "name": "Mayuresh Khot",
      "email": "rahul@example.com",
      "phone": "9876543210",
      "insurance_type": "Health Insurance",
      "age": "35"
    }
  ],
  "allowedFields": ["name", "email", "phone", "insurance_type", "age"],
  "currentTable": "insurance_leads"
}
```

## 🧪 Testing Checklist

### Admin Side:
- [ ] Create new plan with multiple tables
- [ ] Select specific fields for each table
- [ ] Verify field selection persists on edit
- [ ] Test "Select All" / "Deselect All" buttons
- [ ] Save plan and verify configuration

### User Side:
- [ ] Subscribe to plan
- [ ] View leads from different tables
- [ ] Verify only selected fields are visible
- [ ] Test search across visible fields
- [ ] Test sorting on dynamic columns
- [ ] Verify field icons and formatting
- [ ] Check restricted access indicator

### Backend:
- [ ] Verify field filtering on API response
- [ ] Test with empty field selection (should show all)
- [ ] Test with non-existent fields (should handle gracefully)
- [ ] Verify performance with large datasets

## 🚀 Next Steps

1. **Test the Implementation**:
   - Create a test plan with field restrictions
   - Subscribe and verify field visibility
   - Test with different data structures

2. **Enhancements** (Optional):
   - Add field reordering in admin UI
   - Add field aliasing (rename fields for display)
   - Add field-level permissions (view vs download)
   - Add export functionality with field filtering

3. **Documentation**:
   - Update API documentation
   - Create admin user guide
   - Add troubleshooting section

## 🐛 Known Limitations

1. **Field Detection**: Requires at least one record in the table to detect fields
2. **Dynamic Schema**: If form fields change, admin must update plan configuration
3. **No Field Validation**: System doesn't validate field types or formats

## 💡 Tips

- **For Best Results**: Ensure Elementor forms have consistent field names
- **Field Naming**: Use descriptive names (e.g., `insurance_type` not `type`)
- **Testing**: Always test with real data before going live
- **Performance**: Consider pagination for tables with 1000+ records

---

**Status**: ✅ Implementation Complete
**Last Updated**: 2025-01-10
**Version**: 1.0.0
