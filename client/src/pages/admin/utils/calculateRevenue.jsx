  const calculateTotalRevenue = (users) => {
    let revenue = 0;
    users.forEach(user => {
      if (user.Subscriptions && user.Subscriptions.length > 0) {
        user.Subscriptions.forEach(sub => {
          if (sub.status === 'active' || sub.status === 'paid') {
            revenue += sub.amount;
          }
        });
      }
    });
    return revenue;
  };
