import User from '../../models/user.js';

const GetUserStatus = async ({ userId }) => {
  const user = await User
    .findOne({ _id: userId })
    .select({ status: 1 })
    .lean();
  
  return user.status;
};

export default GetUserStatus;
