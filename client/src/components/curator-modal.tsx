import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertCurator } from "@shared/schema";

interface CuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const factions = [
  { value: "government", label: "Government" },
  { value: "fib", label: "FIB" },
  { value: "lspd", label: "LSPD" },
  { value: "sang", label: "SANG" },
  { value: "lscsd", label: "LSCSD" },
  { value: "ems", label: "EMS" },
  { value: "weazel", label: "Weazel News" },
  { value: "detectives", label: "Detectives" },
];

export function CuratorModal({ isOpen, onClose }: CuratorModalProps) {
  const [formData, setFormData] = useState({
    discordId: "",
    name: "",
    faction: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCuratorMutation = useMutation({
    mutationFn: async (data: InsertCurator) => {
      const response = await apiRequest("POST", "/api/curators", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curators"] });
      toast({
        title: "Успешно",
        description: "Куратор успешно добавлен",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить куратора",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setFormData({ discordId: "", name: "", faction: "" });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.discordId || !formData.name || !formData.faction) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля",
        variant: "destructive",
      });
      return;
    }

    createCuratorMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Добавить куратора">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="discordId" className="text-gray-300">Discord ID</Label>
          <Input
            id="discordId"
            type="text"
            placeholder="123456789012345678"
            value={formData.discordId}
            onChange={(e) => setFormData(prev => ({ ...prev, discordId: e.target.value }))}
            className="bg-gray-800 border-gray-600 text-white focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="name" className="text-gray-300">Имя куратора</Label>
          <Input
            id="name"
            type="text"
            placeholder="Введите имя куратора"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-gray-800 border-gray-600 text-white focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="faction" className="text-gray-300">Фракция</Label>
          <Select 
            value={formData.faction} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, faction: value }))}
          >
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Выберите фракцию" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {factions.map((faction) => (
                <SelectItem key={faction.value} value={faction.value} className="text-white hover:bg-gray-700">
                  {faction.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            className="flex-1 bg-gray-600 border-gray-600 text-white hover:bg-gray-700"
          >
            Отмена
          </Button>
          <Button 
            type="submit" 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={createCuratorMutation.isPending}
          >
            {createCuratorMutation.isPending ? "Добавление..." : "Добавить"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
