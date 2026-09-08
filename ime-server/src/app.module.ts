import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { FacultiesModule } from './faculties/faculties.module';
import { DepartmentsModule } from './departments/departments.module';
import { GroupsModule } from './groups/groups.module';
import { LecturesModule } from './lectures/lectures.module';
import { LessonsModule } from './lessons/lessons.module';
import { ChatModule } from './chat/chat.module';
import { ConferenceModule } from './conference/conference.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FilesModule } from './files/files.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { GroupSubjectsModule } from './group-subjects/group-subjects.module';
import { SubjectsModule } from './subjects/subjects.module';
import { SubjectTeachersModule } from './subject-teachers/subject-teachers.module';
import { SemesterModule } from './semester/semester.module';
import { AcademicYearModule } from './academic-year/academic-year.module';
import { HomeworkModule } from './homework/homework.module';
import { MaterialsModule } from './materials/materials.module';
import { ServeStaticModule } from '@nestjs/serve-static';

import { join } from 'path';
import { AdminModule } from './admin/admin.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),

      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    FacultiesModule,
    DepartmentsModule,
    GroupsModule,
    LecturesModule,
    LessonsModule,
    ChatModule,
    SubjectsModule,
    ConferenceModule,
    NotificationsModule,
    FacultiesModule,
    FilesModule,
    GroupSubjectsModule,
    SubjectsModule,
    SubjectTeachersModule,
    SemesterModule,
    AcademicYearModule,
    HomeworkModule,
    MaterialsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
