#version 300 es

precision highp float;

in vec4 v_position;
in vec3 v_normal;
in vec2 v_texcoord;
in vec4 v_color;

out vec4 color;

struct Light {
	//ambiente y camara
	vec3 ambient;
	float cutOff;
	vec3 direction;
	vec3 position;
	vec3 sliderAmbientRGB;
	vec3 sliderCamaraRGB;
	

	//diffuse
	vec3 sliderDiffuseRGB;
	vec3 diffusePosition;
	vec3 diffuseDirection;
	float diffuseCutOff;

	//lampara
	vec3 sliderLamparaRGB;
	vec3 lamparaPosition;
	vec3 lamparaDirection;
	float lamparaCutOff;
	float lamparaIntensidad;
};

uniform vec3 diffuse;
uniform sampler2D diffuseMap;
uniform sampler2D specularMap;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

uniform Light u_light;

uniform vec3 u_viewPosition; // pov position (camera)

void main() {
	vec3 normal = normalize(v_normal);
	vec4 mapColor = texture(diffuseMap, v_texcoord);
	vec4 mapSpec = texture(specularMap, v_texcoord);
	vec3 lightDir = normalize(u_light.position - v_position.xyz);

	vec3 lamparaDir = normalize(u_light.lamparaPosition - v_position.xyz);

	vec3 diffuseDir = normalize(u_light.diffusePosition - v_position.xyz);
	
	//color ambient

	// ambient light
	vec3 ambientLight = u_light.ambient * ambient * mapColor.rgb;
	//ambient color
	vec4 ambientC = vec4 (u_light.sliderAmbientRGB, 1.0);

	//camara color
	vec4 camaraC = vec4 (u_light.sliderCamaraRGB, 1.0);

	//diffuse color
	vec4 diffuseC = vec4 (u_light.sliderDiffuseRGB, 1.0);

	//lampara color
	vec4 lamparaC = vec4 (u_light.sliderLamparaRGB, 1.0);



	vec3 resultamb = vec3(ambientC.r, ambientC.g, ambientC.b) * ambientLight;

	float theta = dot(lightDir, normalize(-u_light.direction));

	float theta2 = dot(lamparaDir, normalize(-u_light.lamparaDirection)); //lampara

	float theta3 = dot(diffuseDir, normalize(-u_light.diffuseDirection)); //diffuse

	

	if (theta > u_light.cutOff) {
		// diffuse light
		float diffuseFactor = max(dot(normal, lightDir), 0.0);
		vec3 diffuseLight = diffuseFactor * diffuse * mapColor.rgb;

		// specular light
		vec3 viewDir = normalize(u_viewPosition - v_position.xyz);
		vec3 reflectDir = reflect(-lightDir, normal);
		float specularFactor = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
		vec3 specularLight = specularFactor	* specular * mapSpec.rgb;

		vec3 result = ambientLight + diffuseLight + specularLight;

		//vec3 result2 = vec3(ambientC.r, ambientC.g, ambientC.b) * result;

		vec3 newColor = vec3(camaraC.r, camaraC.g, camaraC.b) * result;

		color = vec4(newColor, opacity);
	}else if(theta2 > u_light.lamparaCutOff){ //lampara
		// diffuse light
		float diffuseFactor = max(dot(normal, lamparaDir), 0.0);
		vec3 diffuseLight = diffuseFactor * diffuse * mapColor.rgb;

		// specular light
		vec3 viewDir = normalize(u_viewPosition - v_position.xyz);
		vec3 reflectDir = reflect(-lamparaDir, normal);
		float specularFactor = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
		vec3 specularLight = specularFactor	* specular * mapSpec.rgb;

		vec3 result = ambientLight + diffuseLight + specularLight;
		//combine colors

		vec3 newColor = vec3(lamparaC.r, lamparaC.g, lamparaC.b) * result;

	
		color = vec4(newColor, u_light.lamparaIntensidad);

	}else if (theta3 > u_light.diffuseCutOff){ //diffuse
		float diffuseFactor = max(dot(normal, diffuseDir), 0.0);
		vec3 diffuseLight = diffuseFactor * diffuse * mapColor.rgb;

		vec3 result = ambientLight + diffuseLight;

		//combine colors
		vec3 newColor = vec3(ambientC.r, ambientC.g, ambientC.b) * result + vec3(diffuseC.r, diffuseC.g, diffuseC.b) * diffuseLight;

		color = vec4(newColor, opacity);


	}
	else {
		color = vec4(resultamb, opacity);
	}
}

