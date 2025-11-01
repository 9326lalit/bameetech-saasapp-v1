const countActivePlans = (users) => {
  let activePlans = 0;
  users.forEach(user => {
    if (user.Subscriptions && user.Subscriptions.length > 0) {
      user.Subscriptions.forEach(sub => {
        if (sub.status === 'active') activePlans++;
      });
    }
  });
  return activePlans;
};
