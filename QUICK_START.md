# Quick Start Guide - Dynamic Lead Fields

## 🎯 What This Feature Does

Allows super admins to control which fields from lead forms are visible to subscribers on a per-plan basis.

**Example:**
- Form has: name, email, phone, city, age, company, insurance_type
- Admin creates "Basic Plan" showing only: name, email, phone
- Admin creates "Premium Plan" showing all fields
- Subscribers see only the fields their plan allows

## 🚀 Quick Setup (5 Minutes)

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend  
cd client
npm run dev
```

### 2. Create Your First Plan with Field Restrictions

1. **Login as Super Admin**
   - Go to: `http://localhost:5173/super-admin/login`
   - Enter your credentials

2. **Navigate to Plan Management**
   - Click "Plan Management" in sidebar

3. **Create New Plan**
   - Click "+ Add New Plan"
   - Fill in:
     - Name: "Premium Insurance Access"
     - Price: 999
     - Duration: 30
     - Description: "Access to insurance leads"

4. **Configure Lead Access**
   - Scroll to "Lead Access" section
   - Check "Insurance Leads" (or your table name)
   - **Wait 2 seconds** for fields to load
   - Select fields you want subscribers to see:
     - ✅ name
     - ✅ email  
     - ✅ phone
     - ✅ insurance_type
   - Click "Create Plan"

5. **Verify Configuration**
   - Click "Edit" on your plan
   - Confirm selected fields are checked
   - See blue box showing selected fields

### 3. Test as Subscriber

1. **Logout and Login as User**
   - Or create a test user account

2. **Subscribe to Plan**
   - Go to Plans page
   - Subscribe to "Premium Insurance Access"

3. **View Leads**
   - Go to "Leads" section
   - Select your plan
   - Click on "Insurance Leads" table

4. **Verify Field Restrictions**
   - ✅ See only: name, email, phone, insurance_type
   - ✅ Blue info box shows "Restricted Field Access"
   - ✅ Can search and sort on visible fields
   - ❌ Other fields are hidden

## 📋 Key Features

### For Admins:
- ✅ Select which tables to include in a plan
- ✅ Choose specific fields for each table
- ✅ "Select All" / "Deselect All" buttons
- ✅ Visual feedback of configuration
- ✅ Multiple tables per plan

### For Subscribers:
- ✅ See only allowed fields
- ✅ Smart field rendering (emails clickable, phone numbers clickable, etc.)
- ✅ Search across visible fields
- ✅ Sort any column
- ✅ Clear indication of restrictions

## 🎨 UI Features

### Admin Interface:
```
┌─────────────────────────────────────┐
│ Select Lead Tables (Supabase)      │
├─────────────────────────────────────┤
│ ☑ Insurance Leads                   │
│ ☐ Jewellary Leads                   │
│ ☐ Real Estate Leads                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Configure Fields for Each Table     │
├─────────────────────────────────────┤
│ 📊 Insurance Leads    [Select All]  │
│ ☑ name        ☑ email      ☑ phone │
│ ☑ insurance_type  ☐ age    ☐ city  │
│ ☐ company                           │
│                                     │
│ Selected 4 of 7 fields              │
└─────────────────────────────────────┘
```

### User Interface:
```
┌─────────────────────────────────────┐
│ ℹ️ Restricted Field Access          │
│ Your plan allows access to 4        │
│ specific fields from this database. │
│                                     │
│ [name] [email] [phone]              │
│ [insurance_type]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Lead Directory                      │
├──────┬────────┬────────┬────────────┤
│ Name │ Email  │ Phone  │ Ins. Type  │
├──────┼────────┼────────┼────────────┤
│ John │ j@...  │ 98765  │ Health     │
│ Mary │ m@...  │ 98766  │ Life       │
└──────┴────────┴────────┴────────────┘
```

## 🔧 Configuration Examples

### Example 1: Basic Plan (Limited Fields)
```json
{
  "name": "Basic Plan",
  "leadTables": ["insurance_leads"],
  "leadTableFields": {
    "insurance_leads": ["name", "email", "phone"]
  }
}
```
**Result:** Subscribers see only 3 fields

### Example 2: Premium Plan (All Fields)
```json
{
  "name": "Premium Plan",
  "leadTables": ["insurance_leads"],
  "leadTableFields": {
    "insurance_leads": []  // Empty = all fields
  }
}
```
**Result:** Subscribers see all fields

### Example 3: Multi-Table Plan
```json
{
  "name": "Multi-Access Plan",
  "leadTables": ["insurance_leads", "jewellary_leads"],
  "leadTableFields": {
    "insurance_leads": ["name", "email", "insurance_type"],
    "jewellary_leads": ["name", "email", "company", "city"]
  }
}
```
**Result:** Different fields for each table

## 🐛 Troubleshooting

### Fields Not Loading?
**Problem:** "Loading fields..." never completes

**Solutions:**
1. Check if table has at least one record
2. Open browser console (F12) and check for errors
3. Verify backend is running
4. Check endpoint: `/api/admin/lead-tables/YOUR_TABLE/fields`

### All Fields Showing?
**Problem:** Subscriber sees all fields despite restrictions

**Check:**
1. Did you select any fields? (Empty = all fields)
2. Is plan saved correctly? (Edit and verify)
3. Check API response in Network tab

### Table Not Rendering?
**Problem:** Empty table or error

**Check:**
1. Does table have data?
2. Is subscription active?
3. Check browser console for errors

## 📊 Data Flow Diagram

```
Elementor Form
    ↓
Webhook: /collect-lead
    ↓
Supabase Table (e.g., insurance_leads)
    ↓
Admin: Create Plan
    ├─ Select Table: insurance_leads
    └─ Select Fields: name, email, phone
    ↓
User: Subscribe to Plan
    ↓
User: View Leads
    ├─ Backend filters fields
    └─ Frontend renders only allowed fields
```

## 🎯 Best Practices

1. **Field Naming**: Use descriptive names in forms
   - ✅ `insurance_type` 
   - ❌ `type`

2. **Field Selection**: Think about subscriber needs
   - Basic plans: Essential contact info
   - Premium plans: All details

3. **Testing**: Always test with real data
   - Create test plan
   - Subscribe with test user
   - Verify field visibility

4. **Documentation**: Document your field choices
   - Why certain fields are restricted
   - What each plan includes

## 📞 Support

If you encounter issues:
1. Check browser console (F12)
2. Check backend logs
3. Review TESTING_GUIDE.md
4. Review IMPLEMENTATION_SUMMARY.md

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Admin can select fields in plan creation
- ✅ Selected fields persist on edit
- ✅ Subscriber sees only selected fields
- ✅ Blue restriction box appears for subscribers
- ✅ Search and sort work on visible fields
- ✅ Field icons display correctly

---

**That's it! You're ready to use dynamic field restrictions.** 🚀

Start by creating a test plan and see it in action!
