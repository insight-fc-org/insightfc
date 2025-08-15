{{- define "api.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "api.fullname" -}}
{{- printf "%s" (include "api.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}