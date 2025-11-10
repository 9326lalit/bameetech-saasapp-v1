# Testing Guide - Dynamic Lead Table Fields

## Quick Start Testing

### Step 1: Start the Application

```bash
# Terminal 1 - Start Backend
cd server
npm start

# Terminal 2 - Start Frontend
cd client
npm run dev
```

### Step 2: Login as Super Admin

1. Navigate to `http://localhost:5173/super-admin/login`
2. Login with your super admin credentials
3. Go to "Plan Management"

### Step 3: Create a Test Plan with Field Selection

1. Click "Add New Plan"
2. Fill in basic details:
   - Name: "Test Insurance Plan"
   - Price: 999
   - Duration: 30 days
   - Description: "Test plan with field restrictions"

3. Scroll to "Lead Access" section
4. Check the "Insurance Leads" checkbox
5. Wait for fields to load (you should see checkboxes for each field)
6. Select specific fields:
   - ✅ name
   - ✅ email
   - ✅ phone
   - ✅ insurance_type
   - ❌ age (leave unchecked)
   - ❌ city (leave unchecked)
   - ❌ company (leave unchecked)

7. Click "Create Plan"

### Step 4: Verify Admin Configuration

1. Click "Edit" on the plan you just created
2. Verify:
   - "Insurance Leads" is checked
   - Selected fields are still checked
   - Blue box shows selected fields

### Step 5: Test as Subscriber

1. Logout from super admin
2. Login as a regular user (or create a test user)
3. Subscribe to the "Test Insurance Plan"
4. Navigate to "Leads" section
5. Select the plan
6. Click on "Insurance Leads" table

### Step 6: Verify Field Restrictions

**Expected Results:**
- ✅ Table shows ONLY: name, email, phone, insurance_type
- ✅ Blue info box shows "Restricted Field Access"
- ✅ Blue info box lists the 4 allowed fields
- ❌ age, city, company fields are NOT visible
- ✅ Search works across visible fields
- ✅ Sorting works on all columns
- ✅ Field icons appear correctly (email, phone icons)

### Step 7: Test with All Fields Allowed

1. Go back to admin
2. Edit the plan
3. Click "Select All" for Insurance Leads
4. Save the plan
5. Go back to user view
6. Refresh the leads page

**Expected Results:**
- ✅ Table shows ALL fields
- ❌ No blue restriction info box
- ✅ All fields are searchable and sortable

## Detailed Test Cases

### Test Case 1: Multiple Tables with Different Fields

**Setup:**
1. Create a plan with 2 tables:
   - Insurance Leads: name, email, phone
   - Jewellary Leads: name, email, company

**Test:**
1. Subscribe to plan
2. Switch between tables
3. Verify different fields show for each table

**Expected:**
- Insurance table: 3 columns
- Jewellary table: 3 columns (different fields)

### Test Case 2: No Fields Selected

**Setup:**
1. Create a plan
2. Check a table but don't select any fields
3. Save

**Test:**
1. View leads as subscriber

**Expected:**
- ⚠️ Warning in admin: "No fields selected - subscribers will see all fields"
- All fields visible to subscriber
- No restriction info box

### Test Case 3: Field Icons and Formatting

**Test:**
1. View leads with various field types

**Expected:**
- Email fields: 📧 icon + clickable mailto link
- Phone fields: 📞 icon + clickable tel link
- Website fields: 🌐 icon + clickable external link
- Company fields: 🏢 icon
- Name fields: Avatar circle with initial

### Test Case 4: Search Functionality

**Test:**
1. Enter search term in search box
2. Try searching for values in:
   - Visible fields (should work)
   - Hidden fields (should not find)

**Expected:**
- Search only works on visible fields
- Results update in real-time

### Test Case 5: Sorting

**Test:**
1. Click on each column header
2. Verify sorting works

**Expected:**
- First click: ascending order
- Second click: descending order
- Arrow icon indicates sort direction

## Common Issues and Solutions

### Issue 1: Fields Not Loading in Admin

**Symptoms:**
- "Loading fields..." message persists
- No checkboxes appear

**Solution:**
1. Check browser console for errors
2. Verify table has at least one record
3. Check backend logs for API errors
4. Verify endpoint: `/api/admin/lead-tables/:tableName/fields`

### Issue 2: All Fields Showing Despite Restrictions

**Symptoms:**
- Subscriber sees all fields
- No restriction info box

**Possible Causes:**
1. No fields were selected (intentional behavior)
2. Plan configuration not saved properly
3. Backend not filtering fields

**Debug:**
```javascript
// Check API response in browser console
// Should see: "allowedFields": ["name", "email", ...]
```

### Issue 3: Table Not Rendering

**Symptoms:**
- Empty table or "No leads found"

**Solution:**
1. Check if table has data
2. Verify subscription is active
3. Check browser console for errors
4. Verify API response has leads array

### Issue 4: Field Names Look Weird

**Symptoms:**
- Field names like "insurance_type" showing as is

**Expected:**
- Should show as "Insurance Type"

**Solution:**
- This is handled automatically by `formatFieldName()`
- If not working, check console for errors

## API Testing with Postman/curl

### Get Available Fields
```bash
curl -X GET http://localhost:5000/api/admin/lead-tables/insurance_leads/fields \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "tableName": "insurance_leads",
  "fields": ["name", "email", "phone", "city", "insurance_type", "age", "company"]
}
```

### Get Filtered Leads
```bash
curl -X GET "http://localhost:5000/user/plan/1/leads?tableName=insurance_leads" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "leads": [...],
  "allowedFields": ["name", "email", "phone", "insurance_type"],
  "currentTable": "insurance_leads",
  "totalLeads": 4
}
```

## Performance Testing

### Test with Large Dataset

1. Insert 1000+ records into a table
2. Create plan with field restrictions
3. View leads as subscriber

**Expected:**
- Page loads in < 2 seconds
- Pagination works smoothly
- Search is responsive
- No browser lag

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## Mobile Testing

1. Open on mobile device
2. Test table scrolling
3. Verify responsive design
4. Test touch interactions

**Expected:**
- Table scrolls horizontally
- Checkboxes are touch-friendly
- Text is readable
- No layout breaks

## Final Checklist

Before marking as complete:

- [ ] Admin can select fields for each table
- [ ] Field selection persists on edit
- [ ] Subscriber sees only selected fields
- [ ] Search works on visible fields only
- [ ] Sorting works on all columns
- [ ] Field icons display correctly
- [ ] Restriction info box shows when applicable
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All browsers work

---

**Happy Testing! 🎉**

If you encounter any issues not covered here, check the browser console and backend logs for detailed error messages.
