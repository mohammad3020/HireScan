"""
Jobs app serializers
"""
from rest_framework import serializers
from .models import Department, Job


class DepartmentSerializer(serializers.ModelSerializer):
    """Department serializer"""
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class JobSerializer(serializers.ModelSerializer):
    """Job serializer"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    # Backward compatibility: provide demographic_requirements as a computed field
    demographic_requirements = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'department', 'department_name',
            'location', 'employment_type', 'experience_level',
            'salary_min', 'salary_max', 'required_skills',
            'experience_min_years', 'experience_min_years_auto_reject',
            # Individual demographic fields
            'age_range_min', 'age_range_max', 'age_range_auto_reject',
            'gender', 'gender_auto_reject',
            'military_status', 'military_auto_reject',
            'education_level', 'education_level_auto_reject',
            'education_major', 'education_major_auto_reject',
            'preferred_universities_enabled', 'preferred_universities_auto_reject', 'preferred_universities',
            'target_companies_enabled', 'target_companies',
            # Backward compatibility
            'demographic_requirements',
            'auto_reject_rules',
            'created_by', 'created_by_email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_demographic_requirements(self, obj):
        """Build demographic_requirements dict from individual fields for backward compatibility"""
        return {
            'age_range': {
                'min': obj.age_range_min,
                'max': obj.age_range_max,
                'auto_reject': obj.age_range_auto_reject,
            },
            'gender': obj.gender or '',
            'gender_auto_reject': obj.gender_auto_reject,
            'military_status': obj.military_status or '',
            'military_auto_reject': obj.military_auto_reject,
            'education_level': obj.education_level or '',
            'education_level_auto_reject': obj.education_level_auto_reject,
            'education_major': obj.education_major or [],
            'education_major_auto_reject': obj.education_major_auto_reject,
            'preferred_universities_enabled': obj.preferred_universities_enabled,
            'preferred_universities_auto_reject': obj.preferred_universities_auto_reject,
            'preferred_universities': obj.preferred_universities or [],
            'target_companies_enabled': obj.target_companies_enabled,
            'target_companies': obj.target_companies or [],
        }
    
    def create(self, validated_data):
        """Handle demographic_requirements if provided for backward compatibility"""
        demographic_requirements = self.initial_data.get('demographic_requirements', {})
        if demographic_requirements:
            # Extract and set individual fields from demographic_requirements
            age_range = demographic_requirements.get('age_range', {})
            validated_data['age_range_min'] = age_range.get('min')
            validated_data['age_range_max'] = age_range.get('max')
            validated_data['age_range_auto_reject'] = age_range.get('auto_reject', False)
            
            validated_data['gender'] = demographic_requirements.get('gender', '')
            validated_data['gender_auto_reject'] = demographic_requirements.get('gender_auto_reject', False)
            
            validated_data['military_status'] = demographic_requirements.get('military_status', '')
            validated_data['military_auto_reject'] = demographic_requirements.get('military_auto_reject', False)
            
            validated_data['education_level'] = demographic_requirements.get('education_level', '')
            validated_data['education_level_auto_reject'] = demographic_requirements.get('education_level_auto_reject', False)
            
            validated_data['education_major'] = demographic_requirements.get('education_major', [])
            validated_data['education_major_auto_reject'] = demographic_requirements.get('education_major_auto_reject', False)
            
            validated_data['preferred_universities_enabled'] = demographic_requirements.get('preferred_universities_enabled', False)
            validated_data['preferred_universities_auto_reject'] = demographic_requirements.get('preferred_universities_auto_reject', False)
            validated_data['preferred_universities'] = demographic_requirements.get('preferred_universities', [])
            
            validated_data['target_companies_enabled'] = demographic_requirements.get('target_companies_enabled', False)
            validated_data['target_companies'] = demographic_requirements.get('target_companies', [])
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Handle demographic_requirements if provided for backward compatibility"""
        demographic_requirements = self.initial_data.get('demographic_requirements')
        if demographic_requirements is not None:
            # Extract and set individual fields from demographic_requirements
            age_range = demographic_requirements.get('age_range', {})
            instance.age_range_min = age_range.get('min') if 'min' in age_range else instance.age_range_min
            instance.age_range_max = age_range.get('max') if 'max' in age_range else instance.age_range_max
            instance.age_range_auto_reject = age_range.get('auto_reject', instance.age_range_auto_reject)
            
            if 'gender' in demographic_requirements:
                instance.gender = demographic_requirements.get('gender', '')
            if 'gender_auto_reject' in demographic_requirements:
                instance.gender_auto_reject = demographic_requirements.get('gender_auto_reject', False)
            
            if 'military_status' in demographic_requirements:
                instance.military_status = demographic_requirements.get('military_status', '')
            if 'military_auto_reject' in demographic_requirements:
                instance.military_auto_reject = demographic_requirements.get('military_auto_reject', False)
            
            if 'education_level' in demographic_requirements:
                instance.education_level = demographic_requirements.get('education_level', '')
            if 'education_level_auto_reject' in demographic_requirements:
                instance.education_level_auto_reject = demographic_requirements.get('education_level_auto_reject', False)
            
            if 'education_major' in demographic_requirements:
                instance.education_major = demographic_requirements.get('education_major', [])
            if 'education_major_auto_reject' in demographic_requirements:
                instance.education_major_auto_reject = demographic_requirements.get('education_major_auto_reject', False)
            
            if 'preferred_universities_enabled' in demographic_requirements:
                instance.preferred_universities_enabled = demographic_requirements.get('preferred_universities_enabled', False)
            if 'preferred_universities_auto_reject' in demographic_requirements:
                instance.preferred_universities_auto_reject = demographic_requirements.get('preferred_universities_auto_reject', False)
            if 'preferred_universities' in demographic_requirements:
                instance.preferred_universities = demographic_requirements.get('preferred_universities', [])
            
            if 'target_companies_enabled' in demographic_requirements:
                instance.target_companies_enabled = demographic_requirements.get('target_companies_enabled', False)
            if 'target_companies' in demographic_requirements:
                instance.target_companies = demographic_requirements.get('target_companies', [])
        
        return super().update(instance, validated_data)

