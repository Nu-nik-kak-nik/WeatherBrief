import React from "react";
import { useUser } from "../../hooks/useUser";
import { useWeather } from "../../hooks/useWeather";
import { useConfirm } from "../../contexts/ConfirmContext";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import SortableCityItem from "./SortableCityItem";

const SavedCitiesList = ({ onCitySelect }) => {
  const { savedCities, reorderCities, removeCity } = useUser();
  const { setCurrentCity, fetchWeatherByCoords } = useWeather();
  const { showConfirm } = useConfirm();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = savedCities.findIndex((c) => c.id === active.id);
      const newIndex = savedCities.findIndex((c) => c.id === over.id);
      const newOrder = arrayMove(savedCities, oldIndex, newIndex);
      reorderCities(newOrder.map((c) => c.id));
    }
  };

  const handleRemove = async (cityId, cityName) => {
    const confirmed = await showConfirm({
      title: "Удаление города",
      message: `Вы уверены, что хотите удалить "${cityName}"?`,
      confirmText: "Удалить",
      cancelText: "Отмена",
      type: "danger",
    });
    if (confirmed) {
      removeCity(cityId);
    }
  };

  if (!savedCities?.length) {
    return (
      <p className="text-sm text-[#928374] text-center py-2">
        Нет городов. Добавьте через поиск.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={savedCities.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {savedCities.map((city) => (
            <SortableCityItem
              key={city.id}
              id={city.id}
              cityName={
                city.location_name || city.custom_name || "Без названия"
              }
              onClick={() => {
                if (city.latitude && city.longitude) {
                  fetchWeatherByCoords(city.latitude, city.longitude);
                } else if (city.location_name) {
                  setCurrentCity(city.location_name);
                }
                if (onCitySelect) onCitySelect();
              }}
              onRemove={() =>
                handleRemove(
                  city.id,
                  city.location_name || city.custom_name || "Без названия",
                )
              }
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

export default SavedCitiesList;
