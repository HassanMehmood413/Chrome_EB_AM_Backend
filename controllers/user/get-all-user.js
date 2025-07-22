import User from '../../models/user.js';

const GetAllUser = async () => {
  const allUsers = await User
    .find({ role: 'user' })
    .select({
      _id: 1,
      name: 1,
      email: 1,
      role: 1,
      status: 1
    })
    .lean();
  
  return allUsers;
};

export default GetAllUser;
