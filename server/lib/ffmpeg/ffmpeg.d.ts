interface PresetOption {
  frame_rate?: Number
  quality?: Number
  size?: String
}

declare class Video {
  addCommand(command: string, argument: string): void
  fnExtractFrameToJPG(
    assetsDirectoryPath: string,
    settings: PresetOption
  ): Promise<Array<string>>
}
declare function createFFMPEG(videoPath: string): Promise<Video>
export default createFFMPEG
