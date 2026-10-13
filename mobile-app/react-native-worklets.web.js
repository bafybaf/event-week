// Web platformu için react-native-worklets mock'u
// Worklet'ler web'de desteklenmediği için basit bir mock oluşturuyoruz
// react-native-reanimated'ın ihtiyaç duyduğu fonksiyonları sağlıyoruz

// createSerializable - web'de basit bir serializer döndürüyoruz
export function createSerializable(value) {
  // Web'de basit JSON serialization kullanıyoruz
  const serializable = {
    serialize: () => JSON.stringify(value),
    deserialize: (serialized) => JSON.parse(serialized),
    value: value,
    // Reanimated'ın ihtiyaç duyduğu set metodu
    set: (newValue) => {
      serializable.value = newValue;
    },
  };
  return serializable;
}

// createSharedValue - web için basit shared value mock'u
export function createSharedValue(initialValue) {
  return { value: initialValue };
}

// runOnJS - web'de direkt fonksiyon çağrısı
export function runOnJS(fn) {
  return fn;
}

// runOnUI - web'de direkt fonksiyon çağrısı (UI thread yok)
export function runOnUI(fn) {
  return fn;
}

// makeMutable - web için basit mutable value
export function makeMutable(initialValue) {
  return { value: initialValue };
}

// WorkletsModule export
export const WorkletsModule = {
  createSerializable,
  createSharedValue,
  runOnJS,
  runOnUI,
  makeMutable,
};

export default WorkletsModule;
