//home
export * from './home/components/navbar-landing.component';
export * from './home/components/portada.component';
export * from './home/components/saber-mas.component';
export * from './home/components/consulta-descripcion.component';
export * from './home/components/nuvi-descripcion.component';
export * from './home/components/plan-personal-descripcion.component';
export * from './home/components/plan-estandar-descripcion.component';
//consulta
export * from './consulta/components/chat-anamnesis';
export * from './consulta/components/form-mediciones';
export * from './consulta/components/selector-somatotipo';
export * from './consulta/components/form-user-info'
export * from './plan-nutricional/components/btn-generar-orden'
export * from "./consulta/services/consulta.service";
export * from "./consulta/interfaces/mediciones.interface";
export * from "./consulta/dtos/consulta-completa.dto";
export * from "./consulta/dtos/anamnesis-chat.dto";
export * from "./consulta/dtos/orden.dto";
export * from "./plan-nutricional/dtos/plan-nutricional.dto";

//usuario
export * from './consulta/interfaces/info-user.interface';

//ARTICULOS
export * from './articulos/components/sec-articulo.component';
export * from './articulos/components/articulos.component';
export * from './articulos/components/articulo.component';
export * from './articulos/dtos/articulo.dto';
export * from './articulos/dtos/articulos.dto';
export * from './articulos/dtos/sec-articulo.dto';
export * from './articulos/entities/articulo.entity';
export * from './articulos/entities/articulos.entity';
export * from './articulos/entities/sec-articulo.entity';
export * from './articulos/services/articulos.service';

//TESTIMONIOS
export * from './testimonios/components/testimonios.component';
export * from './testimonios/components/testimonio-form.component';
export * from './testimonios/components/testimonio-card.component';
export * from './testimonios/dtos/create-testimonio.dto';
export * from './testimonios/entities/testimonio.entity';
export * from './testimonios/entities/testimonios.entity';
export * from './testimonios/services/testimonios.service';
export * from './testimonios/components/testimonio-form.component';
export * from './testimonios/components/testimonio-form.component';
export * from './testimonios/components/testimonios-all.component';