<?php

// Read in the environment file
$environment = file_get_contents(__DIR__.'/environment.json');
$environment = json_decode($environment);

// Build network pings
$network_list = array();

// Create a quick lookup map of services
foreach ($environment->services as $service) :
  $network_list[] = "http://localhost:".$service->service_port."/";
  if ($service->config->resources) {
    foreach ($service->config->resources as $resource) {
      $network_list[] = "http://localhost:".$service->service_port."/".$resource;
    }
  }
endforeach;

$network_list = array_filter($network_list);
$network_list = array_unique($network_list);

// Run
$handle = curl_init();
for ($i=0; $i<20; $i++){
  foreach ($network_list as $url){
    echo "pinging... ".$url."\n";
    curl_setopt($handle, CURLOPT_URL, $url);
    curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
    $output = curl_exec($handle);
    echo $output."\n";
    usleep(100);
  }
}
curl_close($handle);

 ?>
