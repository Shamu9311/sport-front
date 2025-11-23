import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProductCategories } from '../services/api';

interface ProductFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
}

export interface FilterState {
  category: string;
  timing: string;
}

const ProductFilterModal: React.FC<ProductFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
  const [selectedTiming, setSelectedTiming] = useState(initialFilters.timing);

  const timingOptions = [
    { value: '', label: 'Todos' },
    { value: 'antes', label: 'Antes del entrenamiento' },
    { value: 'durante', label: 'Durante el entrenamiento' },
    { value: 'despues', label: 'Después del entrenamiento' },
    { value: 'diario', label: 'Uso diario' },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setSelectedCategory(initialFilters.category);
    setSelectedTiming(initialFilters.timing);
  }, [initialFilters]);

  const loadCategories = async () => {
    try {
      const cats = await getProductCategories();
      setCategories([{ category_id: '', name: 'Todas' }, ...cats]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleApply = () => {
    onApply({
      category: selectedCategory,
      timing: selectedTiming,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedCategory('');
    setSelectedTiming('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtros</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#D4AF37" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Categorías */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categoría</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContainer}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.category_id}
                    style={[
                      styles.categoryButton,
                      selectedCategory === cat.category_id.toString() && styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(cat.category_id.toString())}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === cat.category_id.toString() && styles.categoryTextActive,
                      ]}
                    >
                      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Timing de consumo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Momento de consumo</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timingScrollContainer}
              >
                {timingOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timingButton,
                      selectedTiming === option.value && styles.timingButtonActive,
                    ]}
                    onPress={() => setSelectedTiming(option.value)}
                  >
                    <Text
                      style={[
                        styles.timingText,
                        selectedTiming === option.value && styles.timingTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1919',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  categoryScrollContainer: {
    paddingHorizontal: 4,
    paddingBottom: 5,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 110,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  categoryText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#1a1919',
    fontWeight: 'bold',
  },
  timingScrollContainer: {
    paddingHorizontal: 4,
    paddingBottom: 5,
  },
  timingButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  timingButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  timingText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  timingTextActive: {
    color: '#1a1919',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#252525',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  clearButtonText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#1a1919',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductFilterModal;

