export interface IService {
  _id?: string;
  nombre: string;
  contador: number;
  tipo: string;
  proveedor: string;
  lavanderia: {
    id: string;
    nombre: string;
  };
  estado: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IServiceResponse {
  code: number;
  state: boolean;
  data: IService[];
  message: string;
  totalRecords: number;
}
