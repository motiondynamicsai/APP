import { Text, View } from "react-native";
import { Link } from 'expo-router'
import { StatusBar } from "expo-status-bar";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-3xl font-pblack">Motion Dynamics</Text>
      <StatusBar style="auto"/>
      <Link href="/home" style={{color: 'blue'}}>Go to Home</Link>
    </View>
  );
}
