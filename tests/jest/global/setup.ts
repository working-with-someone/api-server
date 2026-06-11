import currUser from '../../data/curr-user';
import userFactory from '../../factories/user-factory';

async function globalSetup() {
  await userFactory.createManyAndSave({
    count: 100,
  });
}

export default globalSetup;
