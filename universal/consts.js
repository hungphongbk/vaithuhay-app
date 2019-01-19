export const SOCKET_EV = {
  Image3d: {
    OnUpload: 'image3d:upload',
    UploadProgress: 'image3d:upload:progress',
    UploadProcessed: 'image3d:upload:processed',
    UploadCompleted: 'image3d:upload:completed'
  },
  Util: {
    OnPatchPrice: 'util:patchPrice',
    PatchPriceCompleted: 'util:patchPrice:completed',
    OnSyncSheet: 'util:syncSheet',
    SyncSheetProgress: 'util:syncSheet:progress',
    SyncSheetCompleted: 'util:syncSheet:completed',
    UpdateProductJson: 'util:updateProductJson',
    UpdateProductJsonAll: 'util:updateProductJsonAll',
    UpdateProductJsonPart: 'util:updateProductJsonPart',
    UpdateProductJsonProgress: 'util:updateProductJson:progress',
    UpdateProductJsonCompleted: 'util:updateProductJson:completed',
    UpdateIndexJson: 'util:updateIndexJson',
    UpdateIndexJsonProgress: 'util:updateIndexJson:progress',
    UpdateIndexJsonCompleted: 'util:updateIndexJson:completed'
  },
  GA: {
    UpdateTopProducts: 'ga:updateTopProducts',
    UpdateTopProductsProgress: 'ga:updateTopProducts:progress',
    UpdateTopProductsCompleted: 'ga:updateTopProducts:completed'
  }
}
