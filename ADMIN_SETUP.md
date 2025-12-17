# Admin Panel Setup Guide

## Making Yourself an Admin

To access the Admin Panel, you need to have the admin role assigned to your account. Follow these steps:

### Step 1: Get Your User ID

1. Log into your application
2. Open your browser's developer console (F12)
3. Run this command:
```javascript
(await supabase.auth.getUser()).data.user.id
```
4. Copy the UUID that appears (e.g., `123e4567-e89b-12d3-a456-426614174000`)

### Step 2: Assign Admin Role

Open your backend (Lovable Cloud) and run this SQL query in the database:

```sql
-- Replace 'YOUR_USER_ID_HERE' with the UUID you copied
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin');
```

### Step 3: Refresh and Access Admin Panel

1. Refresh your application
2. You should now see an "Admin Panel" button in the header
3. Click it to access the full admin interface

## Admin Panel Features

Once you have admin access, you can:

### Dashboard
- View comprehensive analytics and statistics
- Monitor total users, accounts, transactions, budgets, bills, and net worth
- Track monthly income, expenses, and savings trends
- Visualize transaction trends with charts
- Analyze top expense categories

### Users Management
- View all registered users
- Grant or revoke admin privileges to other users
- Monitor user activity and join dates

### Accounts Management
- View all user accounts across the system
- See account balances, types, and currencies
- Delete accounts when necessary

### Transactions Management
- Monitor all income and expense transactions
- View transaction details by user
- Delete transactions if needed
- Track transaction categories and amounts

### Budgets Management
- View all budget configurations
- Monitor budget limits and periods
- Manage user budgets across the system

### Bills Management
- Track all recurring bills
- View bill amounts, due dates, and frequencies
- Monitor bill status (active/inactive)
- Delete bills when necessary

### Net Worth Management
- View all assets and liabilities across users
- Monitor total assets, liabilities, and net worth
- Track individual asset/liability entries
- Analyze financial health trends

### Reports & Analytics
- Access comprehensive financial insights
- View monthly income vs expenses trends
- Analyze top expense categories
- Monitor most active users
- Generate visual reports with charts

## Security Notes

- Admin roles are stored securely in a separate table
- All admin actions are protected with Row-Level Security (RLS) policies
- Only users with admin role can access admin-specific data
- Admin status is validated server-side, not client-side

## Design Features

The Admin Panel includes:
- **Collapsible sidebar** navigation with smooth animations
- **Dark/light mode** toggle integrated
- **Responsive design** that works on all screen sizes
- **Beautiful charts** using Recharts for data visualization
- **Real-time data** fetched from your database
- **Professional UI** with smooth transitions and Framer Motion animations
- **Consistent theming** matching your main application

## Troubleshooting

If you don't see the Admin Panel button after assigning the role:
1. Make sure you refreshed the page
2. Clear your browser cache
3. Check the browser console for any errors
4. Verify the role was inserted correctly in the database

If you can't access admin sections:
1. Ensure your user_id in the database matches your logged-in user
2. Verify the RLS policies are enabled on all tables
3. Check that the `is_admin()` function is working correctly
