-- 1. CREACIÓN DE ESQUEMAS
CREATE SCHEMA Catalogo;
GO
CREATE SCHEMA Academico;
GO
CREATE SCHEMA Tramite;
GO
CREATE SCHEMA Documento;
GO
CREATE SCHEMA Evaluacion;
GO

-- 2. ESQUEMA CATALOGO
CREATE TABLE Catalogo.TipoTramite (
    IdTipoTramite INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(20) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255)
);

CREATE TABLE Catalogo.EstadoTramite (
    IdEstadoTramite INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(20) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255)
);

CREATE TABLE Catalogo.LineaInvestigacion (
    IdLineaInvestigacion INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(20) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    Descripcion VARCHAR(255),
    Activa BIT NOT NULL
);

-- 3. ESQUEMA ACADEMICO
CREATE TABLE Academico.Facultad (
    IdFacultad INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(20) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    Estado BIT NOT NULL
);

CREATE TABLE Academico.ProgramaEstudios (
    IdPrograma INT IDENTITY(1,1) PRIMARY KEY,
    IdFacultad INT NOT NULL,
    Codigo VARCHAR(20) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    NumSemestres INT NOT NULL,
    FOREIGN KEY (IdFacultad) REFERENCES Academico.Facultad(IdFacultad)
);

CREATE TABLE Academico.GradoTituloCatalogo (
    IdGradoTitulo INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(20) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    Tipo VARCHAR(50) NOT NULL
);

CREATE TABLE Academico.Persona (
    IdPersona INT IDENTITY(1,1) PRIMARY KEY,
    DNI VARCHAR(15) UNIQUE NOT NULL,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    TipoPersona VARCHAR(50) NOT NULL
);

CREATE TABLE Academico.Docente (
    IdDocente INT IDENTITY(1,1) PRIMARY KEY,
    IdPersona INT NOT NULL,
    Grado VARCHAR(50) NOT NULL,
    TipoContrato VARCHAR(50) NOT NULL,
    FOREIGN KEY (IdPersona) REFERENCES Academico.Persona(IdPersona)
);

-- 4. ESQUEMA TRAMITE
CREATE TABLE Tramite.CoordinacionGT (
    IdCoordinacion INT IDENTITY(1,1) PRIMARY KEY,
    IdFacultad INT NOT NULL,
    IdResponsable INT NOT NULL,
    Estado BIT NOT NULL,
    FOREIGN KEY (IdFacultad) REFERENCES Academico.Facultad(IdFacultad),
    FOREIGN KEY (IdResponsable) REFERENCES Academico.Docente(IdDocente)
);

CREATE TABLE Tramite.Tramite (
    IdTramite INT IDENTITY(1,1) PRIMARY KEY,
    IdPersona INT NOT NULL,
    IdTipoTramite INT NOT NULL,
    IdEstado INT NOT NULL,
    FechaInicio DATE NOT NULL,
    FOREIGN KEY (IdPersona) REFERENCES Academico.Persona(IdPersona),
    FOREIGN KEY (IdTipoTramite) REFERENCES Catalogo.TipoTramite(IdTipoTramite),
    FOREIGN KEY (IdEstado) REFERENCES Catalogo.EstadoTramite(IdEstadoTramite)
);

CREATE TABLE Tramite.Fotografia (
    IdFotografia INT IDENTITY(1,1) PRIMARY KEY,
    IdTramite INT NOT NULL,
    Archivo VARCHAR(255) NOT NULL,
    Formato VARCHAR(10) NOT NULL,
    TamanoKB INT NOT NULL,
    FOREIGN KEY (IdTramite) REFERENCES Tramite.Tramite(IdTramite)
);

CREATE TABLE Tramite.Pago (
    IdPago INT IDENTITY(1,1) PRIMARY KEY,
    IdTramite INT NOT NULL,
    TipoPago VARCHAR(50) NOT NULL,
    Monto DECIMAL(10,2) NOT NULL,
    FechaPago DATE NOT NULL,
    FOREIGN KEY (IdTramite) REFERENCES Tramite.Tramite(IdTramite)
);

CREATE TABLE Tramite.TrabajoInvestigacion (
    IdTrabajo INT IDENTITY(1,1) PRIMARY KEY,
    IdTramite INT NOT NULL,
    Titulo VARCHAR(255) NOT NULL,
    Tipo VARCHAR(50) NOT NULL,
    ModalidadAutor VARCHAR(50) NOT NULL,
    FOREIGN KEY (IdTramite) REFERENCES Tramite.Tramite(IdTramite)
);

CREATE TABLE Tramite.PlanTesis (
    IdPlan INT IDENTITY(1,1) PRIMARY KEY,
    IdTrabajo INT NOT NULL,
    LineaFK INT NOT NULL,
    FechaAprobacion DATE NOT NULL,
    Estado VARCHAR(50) NOT NULL,
    FOREIGN KEY (IdTrabajo) REFERENCES Tramite.TrabajoInvestigacion(IdTrabajo),
    FOREIGN KEY (LineaFK) REFERENCES Catalogo.LineaInvestigacion(IdLineaInvestigacion)
);

-- 5. ESQUEMAS DE DOCUMENTOS Y EVALUACION
CREATE TABLE Documento.Resolucion (
    IdResolucion INT IDENTITY(1,1) PRIMARY KEY,
    IdTramite INT NOT NULL,
    Resultado VARCHAR(100) NOT NULL,
    Fecha DATE NOT NULL,
    Observacion VARCHAR(255),
    FOREIGN KEY (IdTramite) REFERENCES Tramite.Tramite(IdTramite)
);

CREATE TABLE Documento.Diploma (
    IdDiploma INT IDENTITY(1,1) PRIMARY KEY,
    IdTramite INT NOT NULL,
    Tipo VARCHAR(50) NOT NULL,
    Numero VARCHAR(50) NOT NULL,
    FechaEmision DATE NOT NULL,
    FOREIGN KEY (IdTramite) REFERENCES Tramite.Tramite(IdTramite)
);