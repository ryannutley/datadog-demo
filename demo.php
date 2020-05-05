<?php

// Read in the environment file
$environment = file_get_contents(__DIR__.'/environment.json');
$environment = json_decode($environment);

$docker_compose = file_get_contents(__DIR__.'/templates/compose.yml');

// Create a quick lookup map of services
foreach ($environment->services as $service) :
  $service_list[$service->service_id] = array(
    "service" => $service->template_name,
    "type" => $service->template_type,
    "name" => sanitizeServiceName($service->service_name),
    "port" => $service->service_port,
    "paths" => $service->config->resources
  );
endforeach;

// Iterate through each service and map out the environment
foreach ($environment->services as $service) :
  $snippet = file_get_contents(__DIR__.'/templates/docker/'.$service->template_name.'.docker.yml');

  switch ($service->template_type) {
    case "web" :
      $list = array();
      if ($service->connects)
        foreach ($service->connects as $link_to)
          $list[] = ($service_list[$link_to]);
      $list = array_filter($list);
      $list = empty($list) ? null : $list;
      $snippet = str_replace("%%DEMO_CONNECTS%%", json_encode($list), $snippet);
      break;
    default :
      break;
  }

  $service->service_name = sanitizeServiceName($service->service_name);

  $snippet = str_replace("%%SERVICE_NAME%%", $service->service_name, $snippet);
  $snippet = str_replace("%%BUILD_APP%%", $service->build_app, $snippet);
  $snippet = str_replace("%%BUILD_PATH%%", $service->build_path, $snippet);
  $snippet = str_replace("%%SERVICE_PORT%%", $service->service_port, $snippet);

  $snippet = str_replace("%%DEMO_CONFIG%%", json_encode($service->config), $snippet);

  $tags = array(
    "team" => "my-team",
    "cost_center" => "my-team",
    "version" => "1.0.0"
  );
  $snippet = str_replace("%%SERVICE_TAGS%%", json_encode($tags), $snippet);

  $services .= $snippet;
endforeach;

$snippet = file_get_contents(__DIR__.'/templates/docker/datadog.docker.yml');
$services .= $snippet;

$docker_compose = str_replace("%%SERVICES%%", $services, $docker_compose);
$docker_compose = str_replace("%%GLOBAL_ENV%%", $environment->globals->env, $docker_compose);
$docker_compose = str_replace("%%DATADOG_SITE%%", $environment->globals->site, $docker_compose);
$docker_compose = str_replace("%%DATADOG_API%%", $environment->globals->api_key, $docker_compose);

// print_r($docker_compose);

$output = file_put_contents(__DIR__."/docker-compose.yaml", $docker_compose);

function sanitizeServiceName($serviceName){
  $serviceName = strtolower($serviceName);
  $serviceName = str_replace(" ", "-", $serviceName);
  return preg_replace('/[^A-Za-z0-9\-]/', '', $serviceName);;
}

?>
