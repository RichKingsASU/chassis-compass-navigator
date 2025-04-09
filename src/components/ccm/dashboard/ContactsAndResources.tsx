
import React from 'react';
import AccountContacts from './AccountContacts';
import QuickResources from './QuickResources';

const ContactsAndResources = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AccountContacts />
      <QuickResources />
    </div>
  );
};

export default ContactsAndResources;
