//各種設定値記載
var current;
var YOUR_APP_KEY = "APP_KEY";
var YOUR_CLIENT_KEY = "CLI_KEY";
var ncmb;
var map;

//ニフティクラウドmobile backendの準備
 $(function(){
    ncmb = new NCMB(YOUR_APP_KEY,YOUR_CLIENT_KEY);
});

var levels = {
    1: {
        count: 0,
        color: "#0088ff"
    },
    2: {
        count: 0,
        color: "#8888ff"
    },
    3: {
        count: 0,
        color: "#ff8888"
    },
    4: {
        count: 0,
        color: "#ff8800"
    },
    5: {
        count: 0,
        color: "#ff0000"
    }
};

//OSMの描画
function writemap(lat,lon) {
    map = new OpenLayers.Map("canvas");
    var mapnik = new OpenLayers.Layer.OSM();
    map.addLayer(mapnik);
    console.log(lat+":"+lon+":");
    var lonLat = new OpenLayers.LonLat(lat,lon)
        .transform(
            new OpenLayers.Projection("EPSG:4326"), 
            new OpenLayers.Projection("EPSG:900913")
        );
    map.setCenter(lonLat, 15);
    var markers = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markers);
    
    var marker = new OpenLayers.Marker(
    new OpenLayers.LonLat(lat,lon)
        .transform(
            new OpenLayers.Projection("EPSG:4326"), 
            new OpenLayers.Projection("EPSG:900913")
        )
    );
    markers.addMarker(marker);
    circle(lat,lon,"1",10);
}

function circle(lat, lon, level, zoom) {
    var layer_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
    var style_point = {
        strokeColor: levels[level]["color"],
        fillColor: levels[level]["color"],
        fillOpacity: 0.4,    // 内側の透明度
        strokeWidth: 2, // 外周の太さ
        pointRadius: 100  // 半径
    };

    var vectorLayer = new OpenLayers.Layer.Vector("描画テスト", {style: layer_style});
    var point = new OpenLayers.Geometry.Point(lat, lon);
    point.transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
    );
    var pointFeature = new OpenLayers.Feature.Vector(point, null, style_point);

    // レイヤの追加と描画する図の指定
    map.addLayer(vectorLayer);
    vectorLayer.addFeatures([pointFeature]);
}

//OSMの描画時に位置情報取得に成功した場合のコールバック
var onGeoSuccess = function(position){
    current = new CurrentPoint();    
    current.geopoint = position.coords; //位置情報を保存する
    writemap(current.geopoint.longitude,current.geopoint.latitude);
};

//位置情報取得に失敗した場合のコールバック
var onGeoError = function(error){
    console.log("現在位置を取得できませんでした");
};

//位置情報取得時に設定するオプション
var geoOption = {
    timeout: 6000
};

//現在地を保持するクラスを作成
function CurrentPoint(){
    geopoint=null;  //端末の位置情報を保持する
}

//登録されたポイントを引き出し地図上に表示する
function find_geopoint(){
    navigator.geolocation.getCurrentPosition(onFindSuccess, onGeoError, geoOption);
    console.log("find_geopoint");
}
    
//登録ポイントの表示時に位置情報取得に成功した場合のコールバック
var onFindSuccess = function(location){
        current.geopoint = location.coords; 
        var geoPoint = new ncmb.GeoPoint(location.coords.latitude, location.coords.longitude);
        console.log("findpoints:"+location.coords.latitude + ":" + location.coords.longitude);
        
        var zlevel = map.getZoom();
        
        var PlacePointsClass = ncmb.DataStore("PlacePoints");
        //ニフティクラウド mobile backendにアクセスして検索開始位置を指定
        PlacePointsClass.withinKilometers("geo", geoPoint, 30)
                        .fetchAll()
                        .then(function(results){
                            var data = [];
                            
                            helps = new OpenLayers.Layer.Markers("Helps");
                            map.addLayer(helps);
                        
                            
                            for (var i = 0; i < results.length; i++) {
                                  var result = results[i];
                                  var level = result.get("level");
                                  levels[level]++;
                            }
                            var markers = new OpenLayers.Layer.Markers("Markers");
                            map.addLayer(markers);
                            var marker = new OpenLayers.Marker(
                                new OpenLayers.LonLat(regist_location.longitude,regist_location.latitude)
                                                  .transform(
                                                  new OpenLayers.Projection("EPSG:4326"), 
                                                  new OpenLayers.Projection("EPSG:900913")
                                              )
                                  );
                            helps.addMarker(marker);
                              
                          });
        
    };

//現在地をポイントとして登録する
 function save_geopoint(){
     navigator.geolocation.getCurrentPosition(onSaveSuccess, onGeoError, geoOption);
     console.log("save_geopoint");
}

//ポイントの登録時に位置情報取得に成功した場合のコールバック
var onSaveSuccess = function(location){
        navigator.notification.prompt(
            ' ',  // メッセージ
            onPrompt,                  // 呼び出すコールバック
            'ポンイントの登録',            // タイトル
            ['登録','やめる'],             // ボタンのラベル名
            'ポイント名'                 // デフォルトのテキスト
        );
        
        function onPrompt(results) {
            current.geopoint = location.coords; 
            var geoPoint = new ncmb.GeoPoint(location.coords.latitude, location.coords.longitude);
            console.log(location.coords.latitude + ":" + location.coords.longitude);
            
            var Places = ncmb.DataStore("PlacePoints");
            var point = new Places();
            point.set("name",results.input1);
            point.set("geo", geoPoint);

            point.save()
            .then(function(){})
            .catch(function(err){// エラー処理
            });
            
        }
        
    };

    
