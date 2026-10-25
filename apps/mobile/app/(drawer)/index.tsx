import { Redirect } from 'expo-router';
import { DRAWER_HOME_ROUTE } from '@/shared/navigation/modules';

export default function DrawerIndexRoute() {
  return <Redirect href={DRAWER_HOME_ROUTE} />;
}
