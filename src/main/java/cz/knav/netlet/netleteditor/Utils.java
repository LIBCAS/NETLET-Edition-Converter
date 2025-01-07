package cz.knav.netlet.netleteditor;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.XML;

/**
 *
 * @author alberto
 */
public class Utils {
 
    public static JSONObject getAlto(String filename, int page) throws IOException {
        JSONObject ret = new JSONObject();
        File f = Storage.altoPageFile(filename, page);

        if (f.exists()) {
            String xml = FileUtils.readFileToString(f, "UTF-8");
            ret = Utils.altoXMLToJSON(xml);
        } else {
            ret.put("error", "File not found");
        }
        return ret;
    }

    public static JSONObject altoXMLToJSON(String xml) {
        JSONObject ret = XML.toJSONObject(xml);
        Utils.forceToJSONArray(ret);
        return ret;
    }

    public static void forceToJSONArray(JSONObject altoJson)
            throws org.json.JSONException {
        JSONObject ps = altoJson.getJSONObject("alto")
                .getJSONObject("Layout")
                .getJSONObject("Page")
                .getJSONObject("PrintSpace");
        forceToJSONArray(ps, Arrays.asList("TextBlock", "TextLine", "SP"), 0);
        forceToJSONArray(ps, Arrays.asList("TextBlock", "TextLine", "String"), 0);
        forceToJSONArray(ps, Arrays.asList("TextBlock", "TextLine"), 0);
        forceToJSONArray(ps, Arrays.asList("TextBlock"), 0);

    }

    /**
     * Forces a JSON Object to be an Array. When converting from XML to JSON,
     * There may be cases in which we want a list of elements in the final JSON
     * but there is only one element in the XML file, so the XML.toJSONObject
     * method will fail. This methods forces a JSON element to be an array
     * instead of just a JSON Object.
     *
     * @param xmlJSONObj obtained by passing the XML through the method
     * toJSONObject
     * @param obj list of String that contains the path to the JSON child to
     * convert to Array
     * @param index required for recursion, starts at 0
     * @throws org.json.JSONException
     */
    public static void forceToJSONArray(JSONObject xmlJSONObj, List<String> obj, int index)
            throws org.json.JSONException {
        Object myObj = xmlJSONObj.opt(obj.get(index));
        if (myObj instanceof JSONObject && obj.size() == index + 1) {
            JSONObject myJSONObj = (JSONObject) myObj;
            JSONArray jsonArray = new JSONArray();
            jsonArray.put(myJSONObj);
            xmlJSONObj.put(obj.get(index), jsonArray);
        } else if ((myObj instanceof JSONArray) && (obj.size() > (index + 1))) {
            JSONArray arr = (JSONArray) myObj;
            for (int i = 0; i < arr.length(); i++) {
                forceToJSONArray(arr.getJSONObject(i), obj, index + 1);
            }
        } else if (myObj instanceof JSONObject) {
            forceToJSONArray((JSONObject) myObj, obj, index + 1);
        }
    }
}
